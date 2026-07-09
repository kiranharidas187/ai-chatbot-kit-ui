# Config reference

Everything is driven by one `ChatKitConfig` object passed to `<ChatKitProvider>`. Every
field is optional; values deep-merge over the defaults shown below. Use `defineConfig()`
for type-checking and completion.

```tsx
<ChatKitProvider config={defineConfig({ /* … */ })}>
```

## `branding`

| Option | Type | Default | Notes |
|---|---|---|---|
| `botName` | `string` | `'Assistant'` | Header + avatar initial |
| `avatarUrl` | `string` | — | Falls back to an accent circle with the bot's initial |
| `welcomeMessage` | `string` | `'Hi! How can I help you today?'` | Empty-session state |
| `inputPlaceholder` | `string` | `'Type a message…'` | |

## `theme`

See [theming.md](theming.md) for the full guide.

| Option | Type | Default | Notes |
|---|---|---|---|
| `mode` | `'light' \| 'dark' \| 'system'` | `'system'` | `system` tracks `prefers-color-scheme` live |
| `light` / `dark` | `Partial<ThemeColors>` | neutral palette + indigo accent | 14 semantic color tokens per palette |
| `typography.fontSans` | `string` | system-ui stack | |
| `typography.fontMono` | `string` | ui-monospace stack | Code blocks, tool names |
| `typography.baseSize` | `string` | `'0.9375rem'` | Root font size of the widget |
| `radius.sm/md/lg/bubble` | `string` | `0.375/0.625/1/1.125rem` | |
| `spacing.unit` | `string` | `'0.25rem'` | Every internal spacing scales from this |

`ThemeColors` keys: `background`, `surface`, `surfaceHover`, `border`, `foreground`,
`mutedForeground`, `accent`, `accentForeground`, `userBubble`, `userBubbleForeground`,
`assistantBubble`, `assistantBubbleForeground`, `danger`, `dangerForeground`.

## `transport`

Default: none — a demo echo transport is used and a console warning logged.

```ts
transport:
  | { mode: 'sse'; url; headers?; withCredentials?; retry? }
  | { mode: 'websocket'; url; protocols?; reconnect? }
  | { mode: 'http'; url; headers? }
  | { mode: 'custom'; adapter: TransportAdapter }
```

- `retry` / `reconnect`: `Partial<{ maxAttempts: 3; initialDelayMs: 500; maxDelayMs: 4000 }>`
  (exponential backoff).
- Wire formats of the built-ins, and the `mapEvent`/`body` hooks available when you
  construct adapters directly (`createSSETransport(...)` via `mode: 'custom'`), are in
  [custom-transport.md](custom-transport.md).
- `headers` is where auth lives — ChatKit never manages tokens.

## `features`

| Option | Default | What it controls |
|---|---|---|
| `mic` | `true` | Mic button (auto-hidden if the browser/adapter lacks support) |
| `attachments` | `false` | Paperclip + file chips in the composer |
| `markdown` | `true` | Assistant markdown rendering (off = plain text) |
| `codeHighlighting` | `true` | highlight.js inside code fences |
| `messageActions.copy` | `true` | Copy button under assistant answers |
| `messageActions.regenerate` | `true` | Regenerate button (last answer only) |
| `messageActions.feedback` | `false` | 👍/👎 buttons — wire `onFeedback` |

## `sessions`

| Option | Type | Default | Notes |
|---|---|---|---|
| `maxSessions` | `number` | `50` | Creating past the cap evicts the least-recently-updated session |
| `persistence` | `'localStorage' \| 'memory' \| PersistenceAdapter` | `'localStorage'` | See [custom-persistence.md](custom-persistence.md) |

Sessions with no messages are UI-only and never persisted. In-flight message statuses
are sanitized on save (streaming → complete; pending/running → retryable error).

## `speech`

| Option | Type | Default | Notes |
|---|---|---|---|
| `adapter` | `SpeechAdapter` | Web Speech API | Custom STT: `{ isSupported(), start({ lang, onResult, onError, onEnd }), stop() }` — each `onResult` carries the full transcript so far |
| `lang` | `string` | `'en-US'` | |

## `strings`

`Partial<UIStrings>` — every user-facing label (buttons, aria-labels, empty-session
title, error text). Override any subset:

```ts
strings: { newChat: 'Nouvelle conversation', retry: 'Réessayer' }
```

## `onFeedback`

```ts
onFeedback?: (message: TextMessage, feedback: 'up' | 'down') => void
```

Called when the user rates an answer (requires `features.messageActions.feedback`).

## Components & hooks

| Export | Purpose |
|---|---|
| `<ChatKitProvider config?>` | Required ancestor; owns all state |
| `<ChatWindow className? showHeader? showSidebar? sidebarDefaultCollapsed?>` | Batteries-included layout |
| `<ChatSidebar>` / `<ChatMessages>` / `<ChatComposer autoFocus?>` | Composable parts |
| `useChat()` | `{ messages, isGenerating, isTyping, sendMessage, stopGenerating, retry, regenerate }` |
| `useSessions()` | `{ sessions, activeSessionId, createSession, renameSession, deleteSession, switchSession }` |
| `useChatKitConfig()` | Resolved config (mostly for custom components) |
| `createSSETransport` / `createWebSocketTransport` / `createHttpTransport` / `createEchoTransport` | Adapter factories with advanced options |
| `localStoragePersistence` / `memoryPersistence` | Persistence factories |
| `webSpeechAdapter` | Default STT factory |
| `defaultConfig` / `defaultTheme` / `defineConfig` | Config utilities |

Don't forget the stylesheet: `import '@kiranharidas/chat-kit/styles.css'`.
