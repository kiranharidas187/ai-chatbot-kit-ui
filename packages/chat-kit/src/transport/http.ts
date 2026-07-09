import type { ChatEvent, OutgoingMessage, TransportAdapter } from './types';

export interface HttpTransportOptions {
  url: string;
  headers?: Record<string, string>;
  /** Build the POST body. Default: `{ sessionId, message, history }`. */
  body?: (message: OutgoingMessage) => unknown;
  /**
   * Map the JSON response to reply text or ChatEvents. Default accepts a
   * plain string or `{ content | message | reply | text: string }`.
   */
  mapResponse?: (data: unknown) => string | ChatEvent | ChatEvent[];
}

function defaultMapResponse(data: unknown): string | ChatEvent[] {
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    for (const key of ['content', 'message', 'reply', 'text']) {
      if (typeof record[key] === 'string') return record[key];
    }
  }
  throw new Error(
    'Unrecognized response shape — provide `mapResponse` in the HTTP transport options.',
  );
}

/**
 * Plain request/response transport: one POST per turn, the full reply arrives
 * at once. The UI shows its loading state while the request is pending.
 */
export function createHttpTransport(options: HttpTransportOptions): TransportAdapter {
  const mapResponse = options.mapResponse ?? defaultMapResponse;
  const buildBody =
    options.body ??
    ((m: OutgoingMessage) => ({ sessionId: m.sessionId, message: m.content, history: m.history }));

  return {
    async *sendMessage(message, ctx): AsyncGenerator<ChatEvent> {
      try {
        const response = await fetch(options.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...options.headers, ...ctx.headers },
          body: JSON.stringify(buildBody(message)),
          signal: ctx.signal,
        });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const mapped = mapResponse((await response.json()) as unknown);
        if (typeof mapped === 'string') {
          yield { type: 'text', content: mapped };
        } else if (Array.isArray(mapped)) {
          yield* mapped;
        } else {
          yield mapped;
        }
        yield { type: 'done' };
      } catch (err) {
        if (ctx.signal.aborted) throw err;
        yield {
          type: 'error',
          message: err instanceof Error ? err.message : 'Request failed',
          retryable: true,
        };
      }
    },
  };
}
