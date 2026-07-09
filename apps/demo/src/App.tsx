import { ChatWindow, VERSION } from '@kiranharidas/chat-kit';

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <ChatWindow title={`ChatKit v${VERSION}`} />
    </div>
  );
}
