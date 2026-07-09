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

  const config = useMemo(
    () =>
      defineConfig({
        branding: {
          botName: 'Orchestrator',
          welcomeMessage: 'Hi! I am the ChatKit demo bot. Theme me from the toolbar above.',
        },
        theme: {
          mode,
          light: { accent: ACCENTS[accent] },
          dark: { accent: ACCENTS[accent] },
        },
      }),
    [mode, accent],
  );

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
