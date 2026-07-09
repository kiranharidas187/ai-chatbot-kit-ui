# ChatKit — Config-Driven React Chatbot Component Library

## Session bootstrap (read this first)

1. Read `PROGRESS.md` for current milestone status and the exact next step — it is the
   resumability mechanism for interrupted sessions.
2. **Node version**: the shell's default Node is v20, which is too old for pnpm 11. Every
   pnpm/node command must run under Node 26:
   `export PATH="$HOME/.nvm/versions/node/v26.0.0/bin:$PATH"` (repo has `.nvmrc` → 26).
3. Update `PROGRESS.md` before/after each meaningful chunk of work, and update this file
   whenever an architectural decision is made. Commit small and often — every commit must
   leave `pnpm build && pnpm dev` green.

## What this is

A reusable, config-driven React chatbot UI published to npm as **`@kiranharidas/chat-kit`**,
for use across AI agent projects (LangGraph orchestration bots, agentic bots, RAG
assistants). UI/client only — no backend, no auth (consumers pass tokens/headers via
config). Full approved plan: `/Users/kiranharidas/.claude/plans/build-a-config-driven-mighty-kazoo.md`.

## Repo layout

pnpm workspace monorepo:

- `packages/chat-kit/` — the publishable library. `src/index.ts` is the ONLY public API
  surface; anything not exported there is internal.
- `apps/demo/` — Vite + React 19 playground. Consumes the library via `workspace:*`
  against the **built dist** (not source aliases) so packaging bugs surface during dev.
- `docs/` — consumer guides (added in M9).

Planned `packages/chat-kit/src/` structure (built up across milestones M2–M8):
`config/` (ChatKitConfig types, defaults, deep-merge) · `theme/` (ThemeConfig → `--ck-*`
CSS custom properties, scoped to the ChatKit root element, not `:root`) · `transport/`
(TransportAdapter interface + ChatEvent union; sse/websocket/http built-ins) ·
`persistence/` (PersistenceAdapter; localStorage/memory built-ins) · `state/`
(ChatKitProvider + single useReducer, hooks: useChat/useSessions/useChatKitConfig) ·
`speech/` (SpeechAdapter + WebSpeech default) · `components/` (ChatWindow composition
root; sidebar/, messages/, composer/, primitives/) · `styles/chat-kit.css` (Tailwind v4
entry).

## Key abstractions (decided)

- **Everything is driven by one `ChatKitConfig` object**, deep-merged over defaults:
  branding, theme, transport, feature toggles, sessions/persistence, speech.
- **TransportAdapter**: UI only ever consumes a generic `ChatEvent` union
  (`text-delta`, `text`, `thinking-delta`, `tool-call-start`, `tool-call-result`,
  `typing`, `error`, `done`). Custom backends (e.g. LangGraph) map their wire format
  into these events. Built-ins: SSE (fetch+ReadableStream, retry w/ backoff), WebSocket
  (reconnect w/ backoff), HTTP (single POST).
- **PersistenceAdapter**: async loadSessions/loadMessages/saveSession/saveMessages/
  deleteSession. Defaults: localStorage (namespaced, versioned) and memory.
- **Theming**: consumers import precompiled `@kiranharidas/chat-kit/styles.css`; they do
  NOT need Tailwind. Tailwind v4 is a build-time tool only. All visual tokens are
  `--ck-*` CSS custom properties; dark mode via `data-ck-mode` attribute
  (`light`/`dark`/`system`).
- **Tool calls / thinking are distinct message kinds** in the state model, not plain text.

## Commands

All from repo root (remember the Node 26 PATH export):

- `pnpm install` — install workspace deps
- `pnpm dev` — parallel: tsup watch (library) + Vite dev server (demo, http://localhost:5173)
- `pnpm build` — build library (tsup: ESM+CJS+d.ts) then demo
- `pnpm test` — vitest (library core-logic tests)
- `pnpm typecheck` / `pnpm lint` / `pnpm format`

## Conventions

- TypeScript strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` +
  `verbatimModuleSyntax` (use `import type`). Base config: `tsconfig.base.json`.
  TS pinned `~5.9.0` (tsup 8 dts build breaks on TS 6); don't bump until tsup supports it.
- Components: PascalCase `.tsx`, one component per file. Non-component modules:
  camelCase `.ts`. Types live next to the domain they describe (e.g. transport types in
  `transport/types.ts`), not in a global types file.
- Tests: vitest, colocated `*.test.ts` next to the module under test. Core logic only
  (reducer, adapters, config/theme resolution); UI is verified via the demo app.
- Exports: add to `src/index.ts` deliberately; keep the public surface small.
- Peer deps: react/react-dom `^18 || ^19`. Runtime deps kept minimal (react-markdown,
  remark-gfm, rehype-highlight, lucide-react). No state library, no zod.
- User-facing strings go in one central `strings.ts` (i18n-proofing for later).
- Commits: conventional-commit style, small, each leaving the demo runnable.

## Out of scope for v1

Backend/agent implementation, auth, i18n, npm publish CI, changesets, Storybook.
