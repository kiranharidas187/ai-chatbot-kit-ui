# local-consumer example

A minimal Vite + React app that consumes `@kiranharidas/chat-kit` **the way a real npm
user would** — installed with npm from a packed tarball — without publishing anything.

Unlike `apps/demo` (which uses `workspace:*` inside the pnpm workspace), this app lives
outside the workspace and installs the actual pack output. That means it exercises the
`files` allowlist, the `exports` map, the `./styles.css` subpath, and the type
declarations exactly as a published install would, so packaging bugs surface here.

## Run it

```bash
# Node >= 22 required (repo pins 26): export PATH="$HOME/.nvm/versions/node/v26.0.0/bin:$PATH"
cd examples/local-consumer
npm run setup   # builds the lib, packs chat-kit-local.tgz, npm-installs it here
npm run dev     # http://localhost:5173
```

Or from the repo root: `pnpm example` (runs the setup step), then `cd` here and
`npm run dev`.

After changing library source, run `npm run setup` again to rebuild + re-pack +
reinstall.

## What it renders

A single page with `<ChatKitProvider>` + `<ChatWindow>` on the built-in echo transport
(no backend needed), markdown, attachments, and feedback actions enabled. Supports
`/?autosend=hello` for smoke tests, matching the demo app's convention.

`npm run build && npm run preview` verifies the production build of a consuming app.
