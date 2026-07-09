# Theming

ChatKit ships **precompiled CSS** (`@kiranharidas/chat-kit/styles.css`) — you don't need
Tailwind. Every visual decision flows through design tokens that become `--ck-*` CSS
custom properties on the ChatKit root element at runtime. Changing the theme is just a
config change; no rebuild, no CSS override wars.

## How it works

```
config.theme ── deep-merge over defaultTheme ──▶ ResolvedTheme
                                                      │
                        resolveThemeVars(theme, mode) ▼
        <div class="ck-root" style="--ck-color-accent: #0d9488; …" data-ck-mode="dark">
```

- Tokens are scoped to the widget (never `:root`) — multiple instances with different
  themes coexist on one page.
- `mode: 'system'` tracks `prefers-color-scheme` live via `matchMedia`.
- The `light` and `dark` palettes are both part of the theme; the active one is applied
  based on the effective mode.

## Runtime switching

Pass a new config object — that's it:

```tsx
const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');
const config = useMemo(() => defineConfig({ theme: { mode } }), [mode]);
return <ChatKitProvider config={config}>…</ChatKitProvider>;
```

## Example: brand theme (teal SaaS)

```ts
theme: {
  mode: 'system',
  light: {
    accent: '#0d9488',
    accentForeground: '#ffffff',
    userBubble: '#ccfbf1',
    userBubbleForeground: '#134e4a',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    border: '#334155',
    accent: '#2dd4bf',
    accentForeground: '#042f2e',
    userBubble: '#134e4a',
    userBubbleForeground: '#ccfbf1',
  },
  radius: { bubble: '0.75rem', md: '0.5rem' },
}
```

## Example: dense terminal look

```ts
theme: {
  mode: 'dark',
  dark: {
    background: '#0c0c0c',
    surface: '#161616',
    surfaceHover: '#222222',
    border: '#2a2a2a',
    foreground: '#e5e5e5',
    accent: '#22c55e',
    accentForeground: '#052e16',
    userBubble: '#161616',
    assistantBubbleForeground: '#e5e5e5',
  },
  typography: {
    fontSans: "ui-monospace, 'JetBrains Mono', monospace",
    baseSize: '0.875rem',
  },
  radius: { sm: '2px', md: '4px', lg: '6px', bubble: '6px' },
  spacing: { unit: '0.2rem' },   // tightens ALL internal spacing proportionally
}
```

## Token reference

**Colors** (per palette): `background`, `surface` (sidebar, composer, code blocks),
`surfaceHover`, `border`, `foreground`, `mutedForeground`, `accent` /
`accentForeground` (send button, links, avatar, focus rings), `userBubble` /
`userBubbleForeground`, `assistantBubble` / `assistantBubbleForeground` (default
transparent — assistant text sits on the page like ChatGPT/Claude), `danger` /
`dangerForeground` (errors, recording state).

**Typography**: `fontSans`, `fontMono`, `baseSize`.
**Radius**: `sm`, `md`, `lg`, `bubble`.
**Spacing**: `unit` — every internal padding/gap is a multiple of it.

## Branding beyond colors

`branding.avatarUrl` replaces the initial-in-a-circle avatar; `branding.botName`,
`welcomeMessage`, and `inputPlaceholder` cover the chrome text. All other strings
(buttons, labels) are overridable via `config.strings`.

## Embedding in a panel

The widget adapts to its **container**, not the viewport (CSS container queries): below
~672px width the sidebar overlays instead of squeezing the conversation and starts
collapsed. Size it like any block element:

```tsx
<div style={{ height: 520, width: 380, border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden' }}>
  <ChatWindow sidebarDefaultCollapsed />
</div>
```

## Escape hatch

If a token isn't enough, target the stable structural classes (`.ck-root`,
`.ck-markdown`, `.ck-message-enter`, …) from your own CSS — everything is ordinary DOM.
Prefer tokens when possible; class internals may evolve.

## Live demo

`pnpm dev` → toolbar switches mode/accent at runtime, or deep-link e.g.
`http://localhost:5173/?mode=dark&accent=rose`.
