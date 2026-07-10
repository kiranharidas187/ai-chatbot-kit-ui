# Contributing to @kiranharidas/chat-kit

Thanks for your interest in contributing! This document covers the dev setup and the
conventions the repo follows.

## Prerequisites

- **Node >= 22.13** — the repo pins Node 26 via `.nvmrc`, so `nvm use` (or
  `nvm install`) is the easiest path.
- **pnpm 11** — the repo declares `packageManager: pnpm@11`, so
  `corepack enable` gives you the right version automatically.

## Getting started

```bash
git clone https://github.com/kiranharidas187/ai-chatbot-kit-ui.git
cd ai-chatbot-kit-ui
nvm use
pnpm install
pnpm dev          # library watch-build + demo app on http://localhost:5173
```

Useful commands (all from the repo root):

| Command                                        | What it does                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                     | Builds the library, then runs tsup watch + the Vite demo                                                                  |
| `pnpm dev:server`                              | Mock backend on :8787 (needed for the demo's sse/websocket/http modes)                                                    |
| `pnpm test`                                    | Vitest suite (reducer, turn engine, transports, persistence, speech)                                                      |
| `pnpm build`                                   | ESM + CJS + `.d.ts` + `styles.css`                                                                                        |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | ESLint / tsc / Prettier                                                                                                   |
| `pnpm example`                                 | Packs the library into a tarball and npm-installs it into `examples/local-consumer` — the "real consumer" packaging check |

## Repo layout

- `packages/chat-kit/` — the publishable library. `src/index.ts` is the **only** public
  API surface; anything not exported there is internal.
- `apps/demo/` — Vite playground consuming the built dist via `workspace:*`, plus the
  mock backend (`server/mock-server.mjs`).
- `examples/local-consumer/` — consumes the packed tarball with npm, outside the pnpm
  workspace; catches packaging regressions.
- `docs/` — consumer guides (architecture, config reference, transports, persistence,
  theming).

## Making changes

1. Branch off `main`.
2. Keep the public API surface deliberate — new exports go through
   `packages/chat-kit/src/index.ts` and should be discussed in an issue first.
3. Core logic changes need colocated vitest coverage (`*.test.ts`); UI changes are
   verified through the demo app (`?autosend=` is handy for smoke tests).
4. User-facing strings live in `packages/chat-kit/src/strings.ts` only.
5. Add an entry under `## [Unreleased]` in `packages/chat-kit/CHANGELOG.md` for any
   user-facing change.
6. Run `pnpm build && pnpm test && pnpm typecheck && pnpm lint` before pushing — CI
   runs the same steps.

## Commit style

Conventional commits, small and focused — every commit should leave
`pnpm build && pnpm dev` green:

```
feat: add retry policy to websocket transport
fix: keep partial text when a stream aborts
docs: clarify theming token names
```

## Reporting bugs / requesting features

Use the [issue templates](https://github.com/kiranharidas187/ai-chatbot-kit-ui/issues/new/choose).
For security issues, see [SECURITY.md](SECURITY.md) — please don't open public issues
for vulnerabilities.
