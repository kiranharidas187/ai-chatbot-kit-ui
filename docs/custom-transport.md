# Writing a custom transport

The chat UI never talks to the network — it consumes `ChatEvent`s from a
`TransportAdapter`. To connect any backend (LangGraph, a multi-agent orchestrator, an
SDK), you map its output into ChatKit's event vocabulary.

## The interface

```ts
import type { TransportAdapter, ChatEvent, OutgoingMessage, TransportContext } from '@kiranharidas/chat-kit';

interface TransportAdapter {
  /** Handle one user turn. Yield events; finish with `done` (or just return). */
  sendMessage(message: OutgoingMessage, ctx: TransportContext): AsyncIterable<ChatEvent>;

  /** Optional: persistent-connection lifecycle (socket-style backends). */
  connect?(sessionId: string): Promise<void>;
  disconnect?(sessionId: string): void;

  /** Optional: push unsolicited events (e.g. typing) outside a turn. Returns unsubscribe. */
  onServerEvent?(listener: (sessionId: string, event: ChatEvent) => void): () => void;
}
```

- `message`: `{ sessionId, content, history, attachments? }` — `history` is the session's
  prior messages, oldest first.
- `ctx`: `{ sessionId, signal, headers }` — **honor `ctx.signal`**; it aborts when the
  user hits stop or deletes the session.

## The event vocabulary

| Event | UI effect |
|---|---|
| `{ type: 'text-delta', delta }` | Appends to the streaming assistant message |
| `{ type: 'text', content }` | Full reply at once (non-streaming backends) |
| `{ type: 'thinking-delta', delta }` | Streams into the collapsible "Thinking…" block |
| `{ type: 'tool-call-start', toolCallId, toolName, input? }` | Adds a tool-call message (spinner); closes the current text message so following text starts fresh |
| `{ type: 'tool-call-result', toolCallId, output?, isError? }` | Resolves the matching tool call |
| `{ type: 'typing', active }` | Typing dots (independent of message state) |
| `{ type: 'error', message, retryable }` | Errored message with optional Retry button |
| `{ type: 'done', meta? }` | Ends the turn (iterator completion also finalizes) |

Behavior you get for free: thrown errors become retryable error messages; an abort keeps
partial text as the final answer; interleaved text/tool events split into separate
messages automatically.

## Example: LangGraph-style streaming backend

```ts
import { defineConfig, type ChatEvent, type TransportAdapter } from '@kiranharidas/chat-kit';

function createLangGraphTransport(baseUrl: string): TransportAdapter {
  return {
    async *sendMessage(message, ctx) {
      const response = await fetch(`${baseUrl}/runs/stream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...ctx.headers },
        signal: ctx.signal,
        body: JSON.stringify({
          thread_id: message.sessionId,
          input: { messages: [{ role: 'user', content: message.content }] },
        }),
      });

      // however your backend frames its stream — shown here as parsed chunks
      for await (const chunk of parseYourStream(response.body!)) {
        yield* mapLangGraphChunk(chunk);
      }
      yield { type: 'done' };
    },
  };
}

function* mapLangGraphChunk(chunk: YourChunk): Generator<ChatEvent> {
  switch (chunk.event) {
    case 'on_chat_model_stream':
      if (chunk.data.content) yield { type: 'text-delta', delta: chunk.data.content };
      break;
    case 'on_tool_start':
      yield {
        type: 'tool-call-start',
        toolCallId: chunk.run_id,
        toolName: chunk.name,
        input: chunk.data.input,
      };
      break;
    case 'on_tool_end':
      yield { type: 'tool-call-result', toolCallId: chunk.run_id, output: chunk.data.output };
      break;
  }
}

const config = defineConfig({
  transport: { mode: 'custom', adapter: createLangGraphTransport('https://my-agent.example.com') },
});
```

## Shortcut: reuse a built-in with a mapper

If your backend already speaks SSE/WebSocket/HTTP but with its own payload shape, don't
write an adapter from scratch — construct the built-in with a mapping hook:

```ts
import { createSSETransport } from '@kiranharidas/chat-kit';

const adapter = createSSETransport({
  url: 'https://api.example.com/stream',
  // your SSE data payloads → ChatEvents (return null to skip)
  mapEvent: (data) =>
    typeof data === 'object' && data && 'token' in data
      ? { type: 'text-delta', delta: (data as { token: string }).token }
      : null,
  // customize the POST body
  body: (m) => ({ prompt: m.content, thread: m.sessionId }),
});

// config: { transport: { mode: 'custom', adapter } }
```

Equivalent hooks: `createWebSocketTransport({ mapEvent, buildMessage })`,
`createHttpTransport({ mapResponse, body })`.

## Built-in wire formats (if you'd rather conform the backend)

- **SSE** — POST `{ sessionId, message, history, attachments? }`; respond
  `text/event-stream` where each `data:` line is a ChatEvent JSON; `data: [DONE]`
  also ends the turn. Failures before the first event retry with backoff; failures
  mid-stream surface as a retryable error instead (no duplicated output).
- **WebSocket** — client sends `{ type: 'message', sessionId, message, history }`;
  server sends ChatEvent JSON frames with a `sessionId` field alongside. Events for
  sessions with no active turn go to `onServerEvent` (typing indicators). Reconnects
  with backoff.
- **HTTP** — POST same body; respond JSON `{ content | message | reply | text: string }`.

A complete reference backend implementing all three lives at
[`apps/demo/server/mock-server.mjs`](../apps/demo/server/mock-server.mjs).
