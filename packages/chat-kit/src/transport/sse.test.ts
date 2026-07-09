import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChatEvent, OutgoingMessage, TransportContext } from './types';
import { createSSETransport, parseSSE } from './sse';

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}

const message: OutgoingMessage = { sessionId: 's1', content: 'hi', history: [] };
const ctx = (): TransportContext => ({
  sessionId: 's1',
  signal: new AbortController().signal,
  headers: {},
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseSSE', () => {
  it('yields data payloads split across arbitrary chunk boundaries', async () => {
    const payloads = await collect(
      parseSSE(streamOf('data: {"a"', ':1}\n\nda', 'ta: {"b":2}\n\n')),
    );
    expect(payloads).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('joins multi-line data fields and ignores comments and other fields', async () => {
    const payloads = await collect(
      parseSSE(streamOf(': comment\nevent: message\nid: 3\ndata: line1\ndata: line2\n\n')),
    );
    expect(payloads).toEqual(['line1\nline2']);
  });

  it('handles CRLF line endings and a final unterminated event', async () => {
    const payloads = await collect(parseSSE(streamOf('data: one\r\n\r\ndata: two\n')));
    expect(payloads).toEqual(['one', 'two']);
  });
});

describe('createSSETransport', () => {
  it('parses ChatEvent JSON payloads and stops at done', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          streamOf(
            'data: {"type":"text-delta","delta":"Hel"}\n\n',
            'data: {"type":"text-delta","delta":"lo"}\n\n',
            'data: {"type":"done"}\n\n',
          ),
          { status: 200 },
        ),
      ),
    );
    const transport = createSSETransport({ url: 'http://x/sse' });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(events).toEqual([
      { type: 'text-delta', delta: 'Hel' },
      { type: 'text-delta', delta: 'lo' },
      { type: 'done' },
    ]);
  });

  it('treats [DONE] as end of stream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(streamOf('data: {"type":"text","content":"Hi"}\n\ndata: [DONE]\n\n'), {
          status: 200,
        }),
      ),
    );
    const transport = createSSETransport({ url: 'http://x/sse' });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(events).toEqual([
      { type: 'text', content: 'Hi' },
      { type: 'done' },
    ]);
  });

  it('retries with backoff when the connection fails before any event', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(
        new Response(streamOf('data: {"type":"text","content":"ok"}\n\ndata: {"type":"done"}\n\n'), {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const transport = createSSETransport({
      url: 'http://x/sse',
      retry: { maxAttempts: 3, initialDelayMs: 1, maxDelayMs: 2 },
    });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(events[0]).toEqual({ type: 'text', content: 'ok' });
  });

  it('does not retry after events were emitted; surfaces a retryable error instead', async () => {
    // Deliver one event, then fail the stream (enqueue+error in start() would
    // discard the queued chunk, so use pull to sequence it).
    const badStream = () => {
      let step = 0;
      return new ReadableStream<Uint8Array>({
        pull(controller) {
          if (step++ === 0) {
            controller.enqueue(
              new TextEncoder().encode('data: {"type":"text-delta","delta":"par"}\n\n'),
            );
          } else {
            controller.error(new Error('stream reset'));
          }
        },
      });
    };
    const fetchMock = vi.fn(async () => new Response(badStream(), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const transport = createSSETransport({
      url: 'http://x/sse',
      retry: { maxAttempts: 3, initialDelayMs: 1, maxDelayMs: 2 },
    });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      { type: 'text-delta', delta: 'par' },
      { type: 'error', message: 'stream reset', retryable: true },
    ]);
  });

  it('gives up after maxAttempts and emits a retryable error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('refused'));
    vi.stubGlobal('fetch', fetchMock);
    const transport = createSSETransport({
      url: 'http://x/sse',
      retry: { maxAttempts: 2, initialDelayMs: 1, maxDelayMs: 2 },
    });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(events).toEqual([{ type: 'error', message: 'refused', retryable: true }]);
  });

  it('supports a custom mapEvent for non-ChatEvent backends', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(streamOf('data: {"token":"Hey"}\n\n'), { status: 200 })),
    );
    const transport = createSSETransport({
      url: 'http://x/sse',
      mapEvent: (data): ChatEvent | null => {
        const token = (data as { token?: string }).token;
        return token ? { type: 'text-delta', delta: token } : null;
      },
    });
    const events = await collect(transport.sendMessage(message, ctx()));
    expect(events).toEqual([
      { type: 'text-delta', delta: 'Hey' },
      { type: 'done' },
    ]);
  });
});
