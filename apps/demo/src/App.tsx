import {
  ChatKitProvider,
  ChatWindow,
  defineConfig,
  useChat,
  type ThemeMode,
} from '@kiranharidas/chat-kit';
import '@kiranharidas/chat-kit/styles.css';
import { useEffect, useMemo, useRef, useState } from 'react';

const ACCENTS = {
  indigo: '#4f46e5',
  emerald: '#059669',
  rose: '#e11d48',
} as const;

type AccentName = keyof typeof ACCENTS;

const MOCK_SERVER = 'http://localhost:8787';
const TRANSPORTS = ['echo', 'sse', 'websocket', 'http'] as const;
type TransportName = (typeof TRANSPORTS)[number];

function transportConfig(name: TransportName) {
  switch (name) {
    case 'echo':
      return undefined; // library falls back to its built-in echo transport
    case 'sse':
      return { mode: 'sse', url: `${MOCK_SERVER}/api/chat/sse` } as const;
    case 'websocket':
      return { mode: 'websocket', url: 'ws://localhost:8787/api/chat/ws' } as const;
    case 'http':
      return { mode: 'http', url: `${MOCK_SERVER}/api/chat` } as const;
  }
}

// Deep-linkable theme state, e.g. /?mode=dark&accent=rose
function initialParam<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  const value = new URLSearchParams(window.location.search).get(key);
  return valid.includes(value as T) ? (value as T) : fallback;
}

/** Sends a message on mount via the public useChat hook — used by /?autosend=… for demos and smoke tests. */
function AutoSend({ text }: { text: string }) {
  const { sendMessage } = useChat();
  const sent = useRef(false);
  useEffect(() => {
    if (!sent.current) {
      sent.current = true;
      sendMessage(text);
    }
  }, [text, sendMessage]);
  return null;
}

export function App() {
  const autosend = useMemo(() => new URLSearchParams(window.location.search).get('autosend'), []);
  const [mode, setMode] = useState<ThemeMode>(() =>
    initialParam('mode', ['light', 'dark', 'system'], 'system'),
  );
  const [accent, setAccent] = useState<AccentName>(() =>
    initialParam('accent', ['indigo', 'emerald', 'rose'], 'indigo'),
  );
  const [transport, setTransport] = useState<TransportName>(() =>
    initialParam('transport', TRANSPORTS, 'echo'),
  );

  const config = useMemo(() => {
    const chosenTransport = transportConfig(transport);
    const base = defineConfig({
        branding: {
          botName: 'Orchestrator',
          welcomeMessage:
            'Hi! I am the ChatKit demo bot. Pick a transport in the toolbar (sse/websocket/http need `pnpm dev:server`). Try messages containing “tool”, “think”, or “fail”.',
        },
        theme: {
          mode,
          light: { accent: ACCENTS[accent] },
          dark: { accent: ACCENTS[accent] },
        },
        features: { messageActions: { feedback: true } },
        onFeedback: (message, feedback) => console.log('[demo] feedback', feedback, message.id),
      });
    if (chosenTransport) base.transport = chosenTransport;
    return base;
  }, [mode, accent, transport]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          padding: '8px 16px',
          background: '#111',
          color: '#eee',
          fontSize: 13,
        }}
      >
        <strong>ChatKit demo</strong>
        <label>
          mode{' '}
          <select value={mode} onChange={(e) => setMode(e.target.value as ThemeMode)}>
            <option value="system">system</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label>
          accent{' '}
          <select value={accent} onChange={(e) => setAccent(e.target.value as AccentName)}>
            {Object.keys(ACCENTS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          transport{' '}
          <select value={transport} onChange={(e) => setTransport(e.target.value as TransportName)}>
            {TRANSPORTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatKitProvider config={config}>
          {autosend && <AutoSend text={autosend} />}
          <ChatWindow />
        </ChatKitProvider>
      </div>
    </div>
  );
}
