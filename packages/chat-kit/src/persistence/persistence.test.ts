import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Message, Session, TextMessage, ToolCallMessage } from '../types';
import { localStoragePersistence } from './localStorage';
import { memoryPersistence } from './memory';
import { sanitizeMessagesForSave } from './sanitize';
import type { PersistenceAdapter } from './types';

const session = (id: string): Session => ({
  id,
  title: `Session ${id}`,
  createdAt: 1,
  updatedAt: 2,
});

const message = (id: string): Message => ({
  kind: 'text',
  id,
  role: 'user',
  content: 'hello',
  status: 'complete',
  createdAt: 3,
});

function localStorageShim() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    get size() {
      return store.size;
    },
    keys: () => [...store.keys()],
  };
}

function roundTripSuite(name: string, makeAdapter: () => PersistenceAdapter) {
  describe(name, () => {
    it('round-trips sessions and messages', async () => {
      const adapter = makeAdapter();
      await adapter.saveSession(session('a'));
      await adapter.saveSession(session('b'));
      await adapter.saveMessages('a', [message('m1'), message('m2')]);

      expect(await adapter.loadSessions()).toHaveLength(2);
      expect(await adapter.loadMessages('a')).toHaveLength(2);
      expect(await adapter.loadMessages('missing')).toEqual([]);
    });

    it('updates an existing session in place', async () => {
      const adapter = makeAdapter();
      await adapter.saveSession(session('a'));
      await adapter.saveSession({ ...session('a'), title: 'Renamed' });
      const sessions = await adapter.loadSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.title).toBe('Renamed');
    });

    it('deletes a session and its messages', async () => {
      const adapter = makeAdapter();
      await adapter.saveSession(session('a'));
      await adapter.saveMessages('a', [message('m1')]);
      await adapter.deleteSession('a');
      expect(await adapter.loadSessions()).toEqual([]);
      expect(await adapter.loadMessages('a')).toEqual([]);
    });
  });
}

roundTripSuite('memoryPersistence', () => memoryPersistence());

describe('localStoragePersistence', () => {
  afterEach(() => vi.unstubAllGlobals());

  roundTripSuite('with shimmed localStorage', () => {
    vi.stubGlobal('localStorage', localStorageShim());
    return localStoragePersistence();
  });

  it('namespaces keys by prefix so instances do not collide', async () => {
    const shim = localStorageShim();
    vi.stubGlobal('localStorage', shim);
    const one = localStoragePersistence({ prefix: 'app-one' });
    const two = localStoragePersistence({ prefix: 'app-two' });
    await one.saveSession(session('a'));
    await two.saveSession(session('b'));
    expect((await one.loadSessions()).map((s) => s.id)).toEqual(['a']);
    expect((await two.loadSessions()).map((s) => s.id)).toEqual(['b']);
    expect(shim.keys().every((k) => k.includes(':v1:'))).toBe(true);
  });

  it('survives corrupted storage contents', async () => {
    const shim = localStorageShim();
    shim.setItem('chat-kit:v1:sessions', '{not json');
    vi.stubGlobal('localStorage', shim);
    const adapter = localStoragePersistence();
    expect(await adapter.loadSessions()).toEqual([]);
  });
});

describe('sanitizeMessagesForSave', () => {
  it('completes streaming text and errors pending text', () => {
    const streaming: TextMessage = { ...(message('a') as TextMessage), status: 'streaming' };
    const pending: TextMessage = { ...(message('b') as TextMessage), status: 'pending' };
    const [a, b] = sanitizeMessagesForSave([streaming, pending]) as TextMessage[];
    expect(a?.status).toBe('complete');
    expect(b?.status).toBe('error');
    expect(b?.error?.retryable).toBe(true);
  });

  it('marks running tool calls as errored', () => {
    const running: ToolCallMessage = {
      kind: 'tool-call',
      id: 't',
      role: 'assistant',
      toolCallId: 'c',
      toolName: 'search',
      status: 'running',
      createdAt: 1,
    };
    const [result] = sanitizeMessagesForSave([running]) as ToolCallMessage[];
    expect(result?.status).toBe('error');
  });

  it('leaves settled messages untouched (same reference)', () => {
    const settled = message('a');
    const [result] = sanitizeMessagesForSave([settled]);
    expect(result).toBe(settled);
  });
});
