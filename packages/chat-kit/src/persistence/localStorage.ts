import type { Message, Session } from '../types';
import { memoryPersistence } from './memory';
import type { PersistenceAdapter } from './types';

export interface LocalStoragePersistenceOptions {
  /**
   * Key namespace, so multiple ChatKit apps on one origin don't collide.
   * Keys look like `<prefix>:v1:sessions` / `<prefix>:v1:messages:<id>`.
   */
  prefix?: string;
}

const SCHEMA_VERSION = 'v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded / private mode: chat keeps working, persistence degrades.
  }
}

/** Default persistence: browser localStorage, namespaced and versioned. */
export function localStoragePersistence(
  options: LocalStoragePersistenceOptions = {},
): PersistenceAdapter {
  if (typeof localStorage === 'undefined') {
    // SSR or exotic environments: degrade to in-memory.
    return memoryPersistence();
  }

  const prefix = options.prefix ?? 'chat-kit';
  const sessionsKey = `${prefix}:${SCHEMA_VERSION}:sessions`;
  const messagesKey = (sessionId: string) => `${prefix}:${SCHEMA_VERSION}:messages:${sessionId}`;

  const readSessions = (): Session[] => read<Session[]>(sessionsKey) ?? [];

  return {
    loadSessions: () => Promise.resolve(readSessions()),

    saveSession: (session) => {
      const sessions = readSessions();
      const index = sessions.findIndex((s) => s.id === session.id);
      if (index === -1) sessions.push(session);
      else sessions[index] = session;
      write(sessionsKey, sessions);
      return Promise.resolve();
    },

    deleteSession: (sessionId) => {
      write(
        sessionsKey,
        readSessions().filter((s) => s.id !== sessionId),
      );
      try {
        localStorage.removeItem(messagesKey(sessionId));
      } catch {
        // ignore
      }
      return Promise.resolve();
    },

    loadMessages: (sessionId) =>
      Promise.resolve(read<Message[]>(messagesKey(sessionId)) ?? []),

    saveMessages: (sessionId, messages) => {
      write(messagesKey(sessionId), messages);
      return Promise.resolve();
    },
  };
}
