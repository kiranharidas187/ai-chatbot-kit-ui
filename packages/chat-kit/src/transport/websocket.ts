import { sleep } from '../utils/sleep';
import { backoffDelay, DEFAULT_RETRY } from './backoff';
import type { ChatEvent, OutgoingMessage, RetryPolicy, TransportAdapter } from './types';

export interface WebSocketTransportOptions {
  url: string;
  protocols?: string[];
  reconnect?: Partial<RetryPolicy>;
  /**
   * Map an incoming socket payload (JSON-parsed) to a ChatEvent plus the
   * session it belongs to. Default expects ChatEvent JSON with an optional
   * `sessionId` field alongside.
   */
  mapEvent?: (data: unknown) => { sessionId?: string; event: ChatEvent } | null;
  /** Build the outgoing payload for a user message. Default: `{ type: 'message', sessionId, message, history }`. */
  buildMessage?: (message: OutgoingMessage) => unknown;
}

type QueueItem = ChatEvent | 'disconnected' | 'aborted';

class AsyncQueue<T> {
  private items: T[] = [];
  private waiters: Array<(item: T) => void> = [];

  push(item: T): void {
    const waiter = this.waiters.shift();
    if (waiter) waiter(item);
    else this.items.push(item);
  }

  next(): Promise<T> {
    const item = this.items.shift();
    if (item !== undefined) return Promise.resolve(item);
    return new Promise((resolve) => this.waiters.push(resolve));
  }
}

function defaultMapEvent(data: unknown): { sessionId?: string; event: ChatEvent } | null {
  if (typeof data !== 'object' || data === null || !('type' in data)) return null;
  const { sessionId, ...event } = data as { sessionId?: string } & ChatEvent;
  return sessionId !== undefined
    ? { sessionId, event: event as ChatEvent }
    : { event: event as ChatEvent };
}

const OPEN = 1;

/**
 * Bidirectional transport over a single WebSocket. Connects lazily, reconnects
 * with exponential backoff, and routes unsolicited server events (e.g. typing)
 * to `onServerEvent` subscribers even when no turn is in flight.
 */
export function createWebSocketTransport(options: WebSocketTransportOptions): TransportAdapter {
  const reconnect: RetryPolicy = { ...DEFAULT_RETRY, ...options.reconnect };
  const mapEvent = options.mapEvent ?? defaultMapEvent;
  const buildMessage =
    options.buildMessage ??
    ((m: OutgoingMessage) => ({
      type: 'message',
      sessionId: m.sessionId,
      message: m.content,
      history: m.history,
    }));

  let socket: WebSocket | null = null;
  let openPromise: Promise<void> | null = null;
  let closedByUser = false;

  const serverListeners = new Set<(sessionId: string, event: ChatEvent) => void>();
  const activeTurns = new Map<string, AsyncQueue<QueueItem>>();

  function handlePayload(raw: unknown): void {
    let parsed: unknown = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }
    }
    const mapped = mapEvent(parsed);
    if (!mapped) return;
    const sessionId = mapped.sessionId ?? [...activeTurns.keys()][0] ?? '';
    const turn = activeTurns.get(sessionId);
    if (turn) {
      turn.push(mapped.event);
    } else {
      for (const listener of serverListeners) listener(sessionId, mapped.event);
    }
  }

  function ensureSocket(): Promise<void> {
    if (socket && socket.readyState === OPEN) return Promise.resolve();
    if (openPromise) return openPromise;
    closedByUser = false;
    openPromise = new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(options.url, options.protocols);
      socket = ws;
      ws.onopen = () => resolve();
      ws.onmessage = (event: MessageEvent) => handlePayload(event.data);
      ws.onerror = () => {
        // The close handler does the cleanup; reject covers connect-time failures.
        reject(new Error('WebSocket connection error'));
      };
      ws.onclose = () => {
        openPromise = null;
        socket = null;
        reject(new Error('WebSocket closed before opening'));
        for (const queue of activeTurns.values()) queue.push('disconnected');
      };
    });
    // Connect-time rejections surface via await; avoid unhandled rejection noise.
    openPromise.catch(() => {});
    return openPromise;
  }

  return {
    async connect(): Promise<void> {
      await ensureSocket();
    },

    disconnect(): void {
      closedByUser = true;
      socket?.close();
      socket = null;
      openPromise = null;
    },

    onServerEvent(listener) {
      serverListeners.add(listener);
      return () => serverListeners.delete(listener);
    },

    async *sendMessage(message, ctx): AsyncGenerator<ChatEvent> {
      // Connect (or reconnect) with backoff.
      for (let attempt = 0; ; attempt++) {
        if (ctx.signal.aborted) return;
        try {
          await ensureSocket();
          break;
        } catch (err) {
          if (closedByUser || attempt + 1 >= reconnect.maxAttempts) {
            yield {
              type: 'error',
              message: err instanceof Error ? err.message : 'Connection failed',
              retryable: true,
            };
            return;
          }
          await sleep(backoffDelay(attempt, reconnect), ctx.signal);
        }
      }

      const queue = new AsyncQueue<QueueItem>();
      activeTurns.set(message.sessionId, queue);
      const onAbort = () => queue.push('aborted');
      ctx.signal.addEventListener('abort', onAbort, { once: true });

      try {
        socket?.send(JSON.stringify(buildMessage(message)));
        for (;;) {
          const item = await queue.next();
          if (item === 'aborted') return;
          if (item === 'disconnected') {
            yield { type: 'error', message: 'Connection lost', retryable: true };
            return;
          }
          yield item;
          if (item.type === 'done' || item.type === 'error') return;
        }
      } finally {
        ctx.signal.removeEventListener('abort', onAbort);
        activeTurns.delete(message.sessionId);
      }
    },
  };
}
