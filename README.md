# @kiranharidas/chat-kit

Config-driven React chatbot UI component library. Pluggable transports (SSE / WebSocket /
HTTP / custom), multi-session sidebar, themeable via design tokens, agent tool-call and
thinking states as first-class message types.

> 🚧 Under active development — not yet published. Full README with quickstart, config
> reference, and guides lands with milestone M9. See `PROGRESS.md` for current status.

## Local development

```bash
# Requires Node >= 22.13 (repo pins 26 via .nvmrc) and pnpm
nvm use
pnpm install
pnpm dev        # library watch build + demo app on http://localhost:5173
pnpm test       # vitest
pnpm build      # ESM + CJS + d.ts + styles.css
```

Repo layout: `packages/chat-kit` (the library), `apps/demo` (playground / living docs),
`docs/` (consumer guides). Architecture notes: `CLAUDE.md`.
