import { sleep } from '../utils/sleep';
import { backoffDelay, DEFAULT_RETRY } from './backoff';
import type { ChatEvent, OutgoingMessage, RetryPolicy, TransportAdapter } from './types';

export interface SSETransportOptions {
  url: string;
  headers?: Record<string, string>;
  /** Send cookies with the request (`credentials: 'include'`). */
  withCredentials?: boolean;
  retry?: Partial<RetryPolicy>;
  /** Build the POST body. Default: `{ sessionId, message, history }`. */
  body?: (message: OutgoingMessage) => unknown;
  /**
   * Map one SSE `data:` payload (JSON-parsed when possible, else the raw
   * string) to a ChatEvent, or null to skip it. Default expects ChatEvent
   * JSON. Use this to adapt a backend with its own event shape.
   */
  mapEvent?: (data: unknown) => ChatEvent | null;
}

/**
 * Parse a `text/event-stream` body into `data:` payloads (multi-line data
 * joined with \n; comments and other fields ignored).
 */
export async function* parseSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let dataLines: string[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        if (line === '') {
          if (dataLines.length > 0) {
            yield dataLines.join('\n');
            dataLines = [];
          }
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).replace(/^ /, ''));
        }
      }
    }
    if (dataLines.length > 0) yield dataLines.join('\n');
  } finally {
    reader.releaseLock();
  }
}

function defaultMapEvent(data: unknown): ChatEvent | null {
  if (typeof data === 'object' && data !== null && 'type' in data) return data as ChatEvent;
  return null;
}

/**
 * Streaming transport over Server-Sent Events (POST + ReadableStream parse).
 * Connection failures before any event arrived are retried with exponential
 * backoff; failures mid-stream surface as a retryable error event so the UI
 * can offer a retry without duplicating already-rendered content.
 */
export function createSSETransport(options: SSETransportOptions): TransportAdapter {
  const retry: RetryPolicy = { ...DEFAULT_RETRY, ...options.retry };
  const mapEvent = options.mapEvent ?? defaultMapEvent;
  const buildBody =
    options.body ??
    ((m: OutgoingMessage) => ({ sessionId: m.sessionId, message: m.content, history: m.history }));

  return {
    async *sendMessage(message, ctx): AsyncGenerator<ChatEvent> {
      let emitted = false;
      for (let attempt = 0; ; attempt++) {
        try {
          const response = await fetch(options.url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              accept: 'text/event-stream',
              ...options.headers,
              ...ctx.headers,
            },
            body: JSON.stringify(buildBody(message)),
            signal: ctx.signal,
            ...(options.withCredentials ? { credentials: 'include' as const } : {}),
          });
          if (!response.ok) throw new Error(`SSE request failed with status ${response.status}`);
          if (!response.body) throw new Error('SSE response has no body');

          for await (const data of parseSSE(response.body)) {
            if (data === '[DONE]') {
              yield { type: 'done' };
              return;
            }
            let parsed: unknown = data;
            try {
              parsed = JSON.parse(data);
            } catch {
              // keep the raw string; mapEvent decides what to do with it
            }
            const event = mapEvent(parsed);
            if (!event) continue;
            emitted = true;
            yield event;
            if (event.type === 'done') return;
          }
          yield { type: 'done' };
          return;
        } catch (err) {
          if (ctx.signal.aborted) throw err;
          if (!emitted && attempt + 1 < retry.maxAttempts) {
            await sleep(backoffDelay(attempt, retry), ctx.signal);
            continue;
          }
          yield {
            type: 'error',
            message: err instanceof Error ? err.message : 'Connection failed',
            retryable: true,
          };
          return;
        }
      }
    },
  };
}
