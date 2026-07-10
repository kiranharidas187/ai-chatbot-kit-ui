import {
  ChatKitProvider,
  ChatWindow,
  defineConfig,
  useChat,
  VERSION,
} from '@kiranharidas/chat-kit';
import '@kiranharidas/chat-kit/styles.css';
import { useEffect, useMemo, useRef } from 'react';

/** Sends a message on mount — used by /?autosend=… for smoke tests, same as apps/demo. */
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

const config = defineConfig({
  branding: {
    botName: 'Tarball Bot',
    welcomeMessage:
      'This chat is rendered by `@kiranharidas/chat-kit` **installed from a locally packed tarball** — ' +
      'no npm publish involved. It uses the built-in echo transport, so send anything and it comes right back.',
  },
  theme: {
    mode: 'system',
    light: { accent: '#0d9488' },
    dark: { accent: '#2dd4bf' },
  },
  features: { attachments: true, messageActions: { feedback: true } },
  onFeedback: (message, feedback) => console.log('[local-consumer] feedback', feedback, message.id),
});

export function App() {
  const autosend = useMemo(() => new URLSearchParams(window.location.search).get('autosend'), []);

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
          gap: 12,
          alignItems: 'baseline',
          padding: '10px 16px',
          background: '#0f172a',
          color: '#e2e8f0',
          fontSize: 13,
        }}
      >
        <strong>@kiranharidas/chat-kit v{VERSION}</strong>
        <span style={{ opacity: 0.7 }}>
          installed from <code>chat-kit-local.tgz</code> (npm, no publish) — run{' '}
          <code>npm run setup</code> after library changes to re-pack
        </span>
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
