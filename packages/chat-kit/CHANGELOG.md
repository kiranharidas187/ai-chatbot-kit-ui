# Changelog

All notable changes to `@kiranharidas/chat-kit` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-10

Initial release (v1 feature-complete, not yet published to npm).

### Added

- `ChatWindow` batteries-included layout, plus composable `ChatSidebar`,
  `ChatMessages`, `ChatComposer` and headless `useChat` / `useSessions` hooks.
- Single `ChatKitConfig` object (via `defineConfig`) controlling branding, theme,
  transport, feature toggles, sessions, speech, and strings.
- Pluggable transports: SSE (token streaming + retry), WebSocket (reconnect + server
  typing events), HTTP request/response, echo (demo), and the `TransportAdapter` /
  `ChatEvent` interface for custom backends, with `mapEvent` / `body` /
  `buildMessage` / `mapResponse` hooks for foreign wire formats.
- Agent-native rendering: tool calls and thinking/reasoning as first-class message
  kinds with live status.
- Multi-session sidebar with auto-titles and pluggable persistence
  (`localStoragePersistence`, `memoryPersistence`, `PersistenceAdapter` interface).
- Runtime theming via `--ck-*` design-token CSS variables — light/dark/system and
  brand accents switch without rebuild; consumers import precompiled `styles.css`
  (no Tailwind required).
- Markdown rendering (GFM + syntax highlighting), attachments, message actions
  (copy/feedback), voice input via Web Speech API with a pluggable `SpeechAdapter`.
- Accessibility and responsiveness: keyboard navigation, ARIA, reduced motion,
  container-query layout for embedded panels.

[Unreleased]: https://github.com/kiranharidas187/ai-chatbot-kit-ui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kiranharidas187/ai-chatbot-kit-ui/releases/tag/v0.1.0
