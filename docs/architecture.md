# Architecture

ChatKit is three decoupled layers under one config object:

```
┌─────────────────────────────────────────────────────────┐
│ UI layer (components/)                                  │
│   ChatWindow = ChatSidebar + header + ChatMessages +    │
│   ChatComposer; renders only state + ChatEvents         │
├─────────────────────────────────────────────────────────┤
│ State layer (state/)                                    │
│   ChatKitProvider → useReducer(chatReducer)             │
│   runTurn folds transport events into actions           │
│   usePersistenceSync mirrors state ⇄ PersistenceAdapter │
├─────────────────────────────────────────────────────────┤
│ Adapter layer                                           │
│   transport/  TransportAdapter (sse | websocket | http  │
│               | echo | custom)                          │
│   persistence/ PersistenceAdapter (localStorage |       │
│               memory | custom)                          │
│   speech/     SpeechAdapter (webSpeech | custom)        │
└─────────────────────────────────────────────────────────┘
```

## Folder map (`packages/chat-kit/src`)

| Path | Responsibility |
|---|---|
| `index.ts` | **The only public API surface.** Not exported here = internal. |
| `types.ts` | Core domain model: `Message` (`TextMessage` \| `ToolCallMessage`), `Session`, `Attachment` |
| `config/` | `ChatKitConfig` types, defaults, deep-merge resolution (`resolveConfig`) |
| `theme/` | `ChatTheme` types, default theme, `resolveThemeVars` (theme → `--ck-*` CSS vars), system-mode tracking |
| `transport/` | `TransportAdapter` + `ChatEvent` union; built-in sse/websocket/http/echo; `resolveTransport` |
| `persistence/` | `PersistenceAdapter`; localStorage/memory built-ins; save-time sanitization |
| `speech/` | `SpeechAdapter`; Web Speech API default |
| `state/` | `ChatKitProvider`, `chatReducer`, `runTurn`, `useChat`, `useSessions`, `usePersistenceSync` |
| `components/` | `ChatWindow`, `sidebar/`, `messages/`, `composer/`, `internal/` |
| `styles/chat-kit.css` | Tailwind v4 entry compiled to `dist/styles.css` |
| `strings.ts` | All user-facing strings (overridable via `config.strings` — the future i18n seam) |
| `icons.ts` | Single import point for lucide icons |

## Data flow of one turn

1. `ChatComposer` calls `useChat().sendMessage(content, { attachments? })`.
2. `useChat` dispatches the user `MESSAGE_ADDED` (+ session auto-title), then calls
   `runTurn` with an `AbortController` (stored per session — switching sessions doesn't
   kill other sessions' turns; stop/delete does).
3. `runTurn` iterates `transport.sendMessage(outgoing, ctx)` — an
   `AsyncIterable<ChatEvent>` — and folds events into reducer actions:
   - `text-delta`/`thinking-delta` accumulate on an assistant `TextMessage`
   - `tool-call-start` closes the current text message and appends a `ToolCallMessage`
     (so interleaved agent output becomes text → tool → text messages)
   - `error` marks the message errored + retryable; a thrown transport error does the
     same; an abort keeps partial text as the final answer
4. Components re-render from reducer state. `usePersistenceSync` mirrors changes to the
   `PersistenceAdapter` (sessions immediately, messages debounced 400 ms, in-flight
   statuses sanitized so a reload never shows a stuck "streaming" message).

## The ChatEvent contract

The UI renders **only** this vocabulary; every backend is adapted into it:

```ts
type ChatEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'text'; content: string }              // full reply at once
  | { type: 'thinking-delta'; delta: string }
  | { type: 'tool-call-start'; toolCallId; toolName; input? }
  | { type: 'tool-call-result'; toolCallId; output?; isError? }
  | { type: 'typing'; active: boolean }
  | { type: 'error'; message; retryable }
  | { type: 'done'; meta? };
```

This is the seam that keeps the UI backend-agnostic — see
[custom-transport.md](custom-transport.md).

## Theme system

- `config.theme` deep-merges over `defaultTheme` → a `ResolvedTheme`.
- `resolveThemeVars(theme, effectiveMode)` produces `--ck-*` custom properties applied
  **inline on the `.ck-root` element** (never `:root`), so multiple differently-themed
  instances coexist and switching theme/mode is just a re-render.
- The compiled stylesheet maps Tailwind's theme namespaces onto those vars
  (`@theme inline`), so utilities like `bg-accent` resolve to `var(--ck-color-accent)`
  at runtime. Tailwind is build-time only; consumers never need it.
- No global preflight ships; resets are scoped under `.ck-root`.
- `.ck-root` is a CSS size container — components use container queries (`@max-2xl:`)
  to adapt to embedded panels rather than the viewport.

## Build pipeline

`tsup` emits ESM + CJS + `.d.ts` to `dist/`; its `onSuccess` hook runs
`@tailwindcss/cli` to compile `dist/styles.css` (so watch mode keeps CSS fresh as
class names change). `react`/`react-dom` are peers (`^18 || ^19`); runtime deps are
react-markdown, remark-gfm, rehype-highlight, lucide-react.

## Testing strategy

Vitest unit tests cover the non-visual core (reducer, runTurn, SSE parser + retry
semantics, WebSocket lifecycle via a fake socket, persistence round-trips + sanitize,
speech adapter via a fake recognizer). The demo app is the visual verification surface —
`?autosend=`/`?seed=1` URL params exist specifically for headless smoke tests.
