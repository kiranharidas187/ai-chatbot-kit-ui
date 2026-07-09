# Progress Log

> Resumability mechanism: a fresh session reads `CLAUDE.md` + this file and continues
> without the user re-explaining anything. Update before/after each chunk of work.

## Milestone status

| # | Milestone | Status |
|---|-----------|--------|
| M1 | Scaffold monorepo + continuity files | ✅ done |
| M2 | Config types + theme system + CSS pipeline | ⬜ not started |
| M3 | State layer + basic chat UI | ⬜ not started |
| M4 | Transport adapters (SSE/WS/HTTP) + mock server | ⬜ not started |
| M5 | Multi-session sidebar + persistence | ⬜ not started |
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

## In progress

Nothing mid-flight. **Next step:** start M2 — `ChatKitConfig` types/defaults/deep-merge in
`packages/chat-kit/src/config/`, theme→CSS-vars resolver in `src/theme/`, Tailwind v4
pipeline (`@tailwindcss/cli`) emitting `dist/styles.css`, vitest coverage for merge +
resolution, demo themed shell with light/dark toggle. Note: when adding Tailwind, its
native binary (`@tailwindcss/oxide`) must be allowed in `pnpm-workspace.yaml` `allowBuilds`.

## Open questions / pending user input

- (none)

## Decisions made this session

- Package name `@kiranharidas/chat-kit`; pnpm monorepo; precompiled CSS (no consumer
  Tailwind); generic ChatEvent schema; lucide-react; React 18+19 peers; vitest core-logic
  tests. Build tool: tsup. Node 26 via nvm required (see CLAUDE.md bootstrap note).
- TypeScript pinned to `~5.9.0` at root: tsup 8's dts worker is incompatible with TS 6
  (emits TS5101 `baseUrl` deprecation as an error). Revisit when tsup supports TS 6.
