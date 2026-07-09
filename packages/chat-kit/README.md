# @kiranharidas/chat-kit

A config-driven React chatbot UI component library. Drop a ChatGPT/Claude-quality chat
interface into any React app and point it at any backend — SSE streaming, WebSocket,
plain HTTP, or your own custom transport (LangGraph, agent orchestrators, RAG services).

**Features**

- 🎛 **One config object** controls everything: branding, theme, transport, feature
  toggles, sessions, speech
- 🔌 **Pluggable transports** — built-in SSE (token streaming + retry), WebSocket
  (reconnect + server typing events), HTTP (request/response), and a `TransportAdapter`
  interface for custom backends
- 🧠 **Agent-native rendering** — tool calls and thinking/reasoning are first-class
  message types with live status, not text blobs
- 🗂 **Multi-session sidebar** — create/rename/delete/switch, ChatGPT-style auto-titles,
  pluggable persistence (localStorage built in, bring your own DB)
- 🎨 **Runtime theming** — design tokens as CSS custom properties; light/dark/system and
  brand colors switch at runtime, no rebuild, no Tailwind required in your app
- 🎤 **Voice input** — Web Speech API out of the box, pluggable STT interface
- 📝 **Markdown** — GFM tables, syntax-highlighted code blocks, feature-toggleable
- ♿ **Accessible & responsive** — keyboard nav, ARIA, reduced-motion, container-query
  layout that adapts to embedded panels

> 🚧 Not yet published to npm — develop against the demo app for now (see below).

## Quickstart

```bash
npm install @kiranharidas/chat-kit react react-dom
```

```tsx
import { ChatKitProvider, ChatWindow, defineConfig } from '@kiranharidas/chat-kit';
import '@kiranharidas/chat-kit/styles.css';

const config = defineConfig({
  branding: {
    botName: 'Atlas',
    welcomeMessage: 'Hi! Ask me anything about your data.',
  },
  transport: {
    mode: 'sse',
    url: 'https://api.example.com/chat/stream',
    headers: { authorization: `Bearer ${token}` }, // you own auth
  },
  theme: {
    mode: 'system',
    light: { accent: '#0d9488' },
    dark: { accent: '#2dd4bf' },
  },
});

export function App() {
  return (
    <ChatKitProvider config={config}>
      <div style={{ height: '100vh' }}>
        <ChatWindow />
      </div>
    </ChatKitProvider>
  );
}
```

Every field is optional — `<ChatKitProvider>` with no config gives you a working chat
against a demo echo transport.

### Composable parts

`ChatWindow` is the batteries-included layout. For custom layouts, compose the exported
pieces inside the provider: `ChatSidebar`, `ChatMessages`, `ChatComposer`, plus the
`useChat` / `useSessions` hooks for headless control.

## Documentation

| Guide | What's in it |
|---|---|
| [Architecture](docs/architecture.md) | Folder structure, the transport/state/persistence/theme layers, data flow |
| [Config reference](docs/config-reference.md) | Every option, type, and default |
| [Custom transports](docs/custom-transport.md) | `TransportAdapter` + `ChatEvent`, wiring a LangGraph/custom backend |
| [Custom persistence](docs/custom-persistence.md) | `PersistenceAdapter`, syncing sessions to your own API/DB |
| [Theming](docs/theming.md) | Token system, example themes, runtime switching, embedding |

## Local development

```bash
# Requires Node >= 22.13 (repo pins 26 via .nvmrc) and pnpm
nvm use
pnpm install
pnpm dev          # library watch-build + demo app on http://localhost:5173
pnpm dev:server   # mock backend (SSE/WS/HTTP) on :8787 for the demo's transport switcher
pnpm test         # vitest (67 tests: reducer, turn engine, transports, persistence, speech)
pnpm build        # ESM + CJS + d.ts + styles.css
pnpm lint && pnpm typecheck
```

The demo app (`apps/demo`) is the living documentation: theme/mode/accent/transport
switchers in the toolbar, and URL params for quick states (`?mode=dark`,
`?transport=sse`, `?autosend=hello`, `?seed=1`).

In the demo, try messages containing **"tool"** (simulated tool call), **"think"**
(reasoning stream), or **"fail"** (error + retry) against the mock server transports.

## Repo layout

```
packages/chat-kit   the publishable library (src/index.ts = public API)
apps/demo           Vite playground + mock backend server
docs/               consumer guides
```

## License

MIT
