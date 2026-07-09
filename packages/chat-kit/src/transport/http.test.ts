import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpTransport } from './http';
import type { OutgoingMessage, TransportContext } from './types';

const message: OutgoingMessage = { sessionId: 's1', content: 'hi', history: [] };
const ctx = (): TransportContext => ({
  sessionId: 's1',
  signal: new AbortController().signal,
  headers: { authorization: 'Bearer t' },
});

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createHttpTransport', () => {
  it('yields the full reply as one text event', async () => {
    const fetchMock = vi.fn(async () => Response.json({ content: 'Full answer' }));
    vi.stubGlobal('fetch', fetchMock);
    const transport = createHttpTransport({ url: 'http://x/chat' });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(events).toEqual([
      { type: 'text', content: 'Full answer' },
      { type: 'done' },
    ]);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer t');
    expect(JSON.parse(init.body as string)).toMatchObject({ sessionId: 's1', message: 'hi' });
  });

  it('accepts alternative reply keys', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ reply: 'Hey' })));
    const transport = createHttpTransport({ url: 'http://x/chat' });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(events[0]).toEqual({ type: 'text', content: 'Hey' });
  });

  it('emits a retryable error on HTTP failure status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const transport = createHttpTransport({ url: 'http://x/chat' });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(events).toEqual([
      { type: 'error', message: 'Request failed with status 500', retryable: true },
    ]);
  });

  it('supports mapResponse returning ChatEvents', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ answer: 'Hi', tool: 'search' })));
    const transport = createHttpTransport({
      url: 'http://x/chat',
      mapResponse: (data) => {
        const record = data as { answer: string };
        return [{ type: 'text', content: record.answer }];
      },
    });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(events).toEqual([
      { type: 'text', content: 'Hi' },
      { type: 'done' },
    ]);
  });
});
