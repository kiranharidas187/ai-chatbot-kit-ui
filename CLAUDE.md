# ChatKit — Config-Driven React Chatbot Component Library

## Session bootstrap (read this first)

1. Read `PROGRESS.md` for current status and next steps — it is the resumability
   mechanism for interrupted sessions.
2. **Node version**: the shell's default Node is v20, too old for pnpm 11. Every
   pnpm/node command must run under Node 26:
   `export PATH="$HOME/.nvm/versions/node/v26.0.0/bin:$PATH"` (repo has `.nvmrc` → 26).
3. Update `PROGRESS.md` before/after each meaningful chunk of work, and update this file
   whenever an architectural decision is made. Commit small and often — every commit must
   leave `pnpm build && pnpm dev` green.

## What this is

A reusable, config-driven React chatbot UI intended for npm as
**`@kiranharidas/chat-kit`**, for use across AI agent projects (LangGraph orchestration
bots, agentic bots, RAG assistants). UI/client only — no backend, no auth (consumers
pass tokens/headers via config). **v1 feature-complete: all 9 milestones done** (see
PROGRESS.md). Not yet published to npm.

## Repo layout

pnpm workspace monorepo:

- `packages/chat-kit/` — the publishable library. `src/index.ts` is the ONLY public API
  surface; anything not exported there is internal. Has its own README.md (copy of the
  root one — keep both in sync; npm packs the package-level one).
- `apps/demo/` — Vite + React 19 playground. Consumes the library via `workspace:*`
  against the **built dist** (not source aliases) so packaging bugs surface during dev.
  `server/mock-server.mjs` = reference backend (SSE/WS/HTTP + "tool"/"think"/"fail"
  prompt triggers). Demo URL params: `?mode=`, `?accent=`, `?transport=`,
  `?autosend=<msg>` (auto-send for smoke tests), `?seed=1` (plants localStorage session
  to test hydration).
- `docs/` — consumer guides: architecture, config-reference, custom-transport,
  custom-persistence, theming.

`packages/chat-kit/src/`: `config/` (ChatKitConfig, defaults, deepMerge) · `theme/`
(tokens → `--ck-*` vars on `.ck-root`, never `:root`) · `transport/` (TransportAdapter +
ChatEvent union; sse/websocket/http/echo built-ins + `serialize.ts` shared body) ·
`persistence/` (localStorage/memory + save-time sanitize) · `speech/` (webSpeech
adapter) · `state/` (ChatKitProvider, chatReducer, runTurn, useChat, useSessions,
usePersistenceSync) · `components/` (ChatWindow, sidebar/, messages/, composer/,
internal/) · `styles/chat-kit.css` · `strings.ts` (all UI strings; i18n seam) ·
`icons.ts` (single lucide import point).

## Key abstractions (implemented)

- **One `ChatKitConfig` object** drives everything, deep-merged over defaults:
  branding, theme, transport, features (mic/attachments/markdown/codeHighlighting/
  messageActions), sessions (maxSessions/persistence), speech, strings, onFeedback.
- **TransportAdapter → ChatEvent**: UI renders only the ChatEvent union (`text-delta`,
  `text`, `thinking-delta`, `tool-call-start/result`, `typing`, `error`, `done`).
  `runTurn` (state/runTurn.ts) folds events into reducer actions; interleaved
  text/tool-call output splits into separate messages; abort keeps partial text; thrown
  errors → retryable error message. Built-ins take `mapEvent`/`body`/`buildMessage`/
  `mapResponse` hooks for foreign wire formats.
- **PersistenceAdapter**: hydrate once on mount (fresh empty session goes on top),
  debounced full-list message saves, empty sessions never persisted, statuses/blobs
  sanitized on save.
- **Theming**: consumers import precompiled `styles.css`; NO Tailwind needed by them.
  Tailwind v4 is build-time only (`@theme inline` maps utilities onto `--ck-*` runtime
  vars). `.ck-root` is a CSS size container — components adapt via `@max-2xl:` container
  queries (sidebar overlays + auto-collapses in narrow embeds).
- **Tool calls / thinking are distinct message kinds**, not text.

## Commands

All from repo root (remember the Node 26 PATH export):

- `pnpm install`
- `pnpm dev` — prebuilds lib, then tsup watch + Vite demo (http://localhost:5173)
- `pnpm dev:server` — mock backend on :8787 (needed for sse/websocket/http demo modes)
- `pnpm test` — vitest, 67 tests (reducer, runTurn, SSE parse/retry, WS lifecycle,
  persistence, speech)
- `pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm format`
- Packaging check: `cd packages/chat-kit && pnpm pack` → install tarball in a scratch
  Vite app (see PROGRESS.md M9 for the verified recipe)

## Conventions

- TypeScript strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` +
  `verbatimModuleSyntax` (use `import type`). Base: `tsconfig.base.json` (lib ES2023).
  TS pinned `~5.9.0` — tsup 8's dts build breaks on TS 6; don't bump until tsup supports it.
- Components: PascalCase `.tsx`, one per file. Non-component modules: camelCase `.ts`.
  Types live next to their domain (e.g. `transport/types.ts`); shared core model in
  `src/types.ts`.
- Tests: vitest, colocated `*.test.ts`. Core logic only; UI verified via the demo
  (headless Chrome screenshots with `?autosend=`).
- Exports: add to `src/index.ts` deliberately; keep the surface small.
- Peers: react/react-dom `^18 || ^19`. Runtime deps: react-markdown, remark-gfm,
  rehype-highlight, lucide-react. No state lib, no zod.
- User-facing strings only in `strings.ts`.
- Commits: conventional-commit style, small, demo always runnable.
- pnpm 11 blocks dependency build scripts — allow new native deps in
  `pnpm-workspace.yaml` `allowBuilds` (esbuild, @tailwindcss/oxide, @parcel/watcher
  already allowed).

## Known future work (post-v1)

- highlight.js makes consumer bundles ~500 kB pre-gzip — consider lazy-loading
  rehype-highlight when `codeHighlighting` enabled.
- npm publish CI + changesets; i18n (strings.ts is the seam); attachment upload helpers.

## Out of scope for v1

Backend/agent implementation, auth, i18n, npm publish CI, changesets, Storybook.
