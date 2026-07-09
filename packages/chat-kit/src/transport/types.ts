import type { Attachment, Message } from '../types';

/**
 * The generic event vocabulary every transport emits. The UI renders only
 * these events; custom backends (e.g. LangGraph) map their wire format into
 * this union inside a custom TransportAdapter.
 */
export type ChatEvent =
  | { type: 'text-delta'; delta: string }
  /** Full reply at once — what non-streaming HTTP transports emit. */
  | { type: 'text'; content: string }
  | { type: 'thinking-delta'; delta: string }
  | { type: 'tool-call-start'; toolCallId: string; toolName: string; input?: unknown }
  | { type: 'tool-call-result'; toolCallId: string; output?: unknown; isError?: boolean }
  /** Server-driven typing indicator (WebSocket-style transports). */
  | { type: 'typing'; active: boolean }
  | { type: 'error'; message: string; retryable: boolean }
  | { type: 'done'; meta?: Record<string, unknown> };

export interface OutgoingMessage {
  sessionId: string;
  content: string;
  attachments?: Attachment[];
  /** Prior messages in the session, oldest first, for transports that send full context. */
  history: Message[];
}

export interface TransportContext {
  sessionId: string;
  /** Aborted when the user cancels generation or deletes the session mid-flight. */
  signal: AbortSignal;
  /** Extra headers from config (auth tokens etc.); consumers own auth. */
  headers: Record<string, string>;
}

export interface TransportAdapter {
  /**
   * Handle one user turn. Yield events until the turn finishes; emit `done`
   * last (the provider also finalizes on iterator completion).
   */
  sendMessage(message: OutgoingMessage, ctx: TransportContext): AsyncIterable<ChatEvent>;
  /** Optional persistent-connection lifecycle for socket-style adapters. */
  connect?(sessionId: string): Promise<void>;
  disconnect?(sessionId: string): void;
  /** Subscribe to unsolicited server events (e.g. typing). Returns an unsubscribe fn. */
  onServerEvent?(listener: (sessionId: string, event: ChatEvent) => void): () => void;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export type TransportConfig =
  | {
      mode: 'sse';
      url: string;
      headers?: Record<string, string>;
      withCredentials?: boolean;
      retry?: Partial<RetryPolicy>;
    }
  | { mode: 'websocket'; url: string; protocols?: string[]; reconnect?: Partial<RetryPolicy> }
  | { mode: 'http'; url: string; headers?: Record<string, string> }
  | { mode: 'custom'; adapter: TransportAdapter };
