# Progress Log

> Resumability mechanism: a fresh session reads `CLAUDE.md` + this file and continues
> without the user re-explaining anything. Update before/after each chunk of work.

## Milestone status

| # | Milestone | Status |
|---|-----------|--------|
| M1 | Scaffold monorepo + continuity files | ✅ done |
| M2 | Config types + theme system + CSS pipeline | ✅ done |
| M3 | State layer + basic chat UI | ✅ done |
| M4 | Transport adapters (SSE/WS/HTTP) + mock server | ✅ done |
| M5 | Multi-session sidebar + persistence | ✅ done |
| M6 | Markdown, tool-call/thinking rendering, message actions | ⬜ not started |
| M7 | Mic / voice input | ⬜ not started |
| M8 | A11y, responsive, polish | ⬜ not started |
| M9 | Docs + packaging verification | ⬜ not started |

## Done and confirmed working

- **M1 scaffold** — pnpm monorepo (`packages/chat-kit` + `apps/demo`), tsup dual
  ESM/CJS/d.ts build, Vite 8 + React 19.2 demo consuming the library's built dist via
  `workspace:*`, ESLint 10 flat config, Prettier, vitest 4 wired.
  Verify: `pnpm build && pnpm typecheck && pnpm lint && pnpm test` all green;
  `pnpm dev` serves http://localhost:5173 showing the ChatWindow placeholder.

- **M2 config + theme + CSS pipeline** — full type surface for all adapters
  (`src/transport/types.ts`, `src/persistence/types.ts`, `src/speech/types.ts`, core
  domain in `src/types.ts`), `ChatKitConfig` defaults + deepMerge (`src/config/`),
  theme→`--ck-*` vars resolver + system-mode tracking (`src/theme/`), Tailwind v4
  compiled to `dist/styles.css` via tsup `onSuccess` (scoped reset, no preflight leak,
  default palette wiped — components use semantic tokens only). ChatKitProvider carries
  resolved config; ChatWindow is a themed static shell.
  Verify: `pnpm test` (12 tests), `pnpm dev` → http://localhost:5173/?mode=dark&accent=rose
  shows dark rose-accented shell; mode/accent switch live from the demo toolbar.

- **M3 state layer + chat UI** — `chatReducer` (multi-session-ready), `runTurn` folds the
  ChatEvent stream into actions (interleaved text/tool-call handling, abort keeps partial
  text, thrown errors → retryable error message), `useChat` hook (send/stop/retry, session
  auto-title from first message), echo transport fallback, ChatMessages (auto-scroll that
  releases when user scrolls up), MessageBubble (user/assistant/system + error w/ retry),
  ToolCallItem (compact; full view M6), ChatComposer (auto-grow, Enter sends, stop button),
  typing dots + streaming caret + enter animations (reduced-motion aware).
  Verify: `pnpm test` (33 tests); `pnpm dev` → send a message, watch the echoed reply
  stream; `/?autosend=hi` auto-sends for smoke tests.

- **M4 transports** — `createSSETransport` (POST + ReadableStream SSE parse, retries with
  backoff only before first event, [DONE] sentinel, `mapEvent` hook for custom backends),
  `createWebSocketTransport` (lazy connect, reconnect w/ backoff, onServerEvent routing of
  unsolicited typing events, per-session turn queues), `createHttpTransport` (single POST,
  flexible response mapping). Provider subscribes to server typing pushes. Mock backend
  `apps/demo/server/mock-server.mjs` (`pnpm dev:server`, port 8787) covers all three +
  prompt tricks: "tool" → tool call, "think" → thinking deltas, "fail" → error event.
  Verify: `pnpm test` (52 tests); `pnpm dev:server` + `pnpm dev` → toolbar transport
  select; `/?transport=sse&autosend=use a tool` shows the tool-call chip streaming.

- **M5 sessions + persistence** — `localStoragePersistence` / `memoryPersistence`,
  `usePersistenceSync` (hydrate once, debounced message saves, status sanitization on
  save, empty sessions never persisted), `useSessions` (create/rename/delete/switch,
  maxSessions eviction, lazy history load), collapsible `ChatSidebar` with inline rename
  and two-step delete. Verify: `pnpm test` (63 tests); `pnpm dev` → chat, reload, session
  restored; `/?seed=1` proves hydration in one load.

## In progress

Nothing mid-flight. **Next step:** start M6 — markdown rendering (react-markdown +
remark-gfm + rehype-highlight, gated by `features.markdown`/`codeHighlighting`),
expanded tool-call component (collapsible input/output), thinking disclosure on
assistant messages, message actions (copy/regenerate/feedback per
`features.messageActions`). Mock server already streams markdown + tool calls +
thinking ("tool"/"think" prompts) for testing.

## Open questions / pending user input

- (none)

## Decisions made this session

- Package name `@kiranharidas/chat-kit`; pnpm monorepo; precompiled CSS (no consumer
  Tailwind); generic ChatEvent schema; lucide-react; React 18+19 peers; vitest core-logic
  tests. Build tool: tsup. Node 26 via nvm required (see CLAUDE.md bootstrap note).
- TypeScript pinned to `~5.9.0` at root: tsup 8's dts worker is incompatible with TS 6
  (emits TS5101 `baseUrl` deprecation as an error). Revisit when tsup supports TS 6.
