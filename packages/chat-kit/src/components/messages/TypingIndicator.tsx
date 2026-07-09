import { useChatKitConfig } from '../../state/ChatKitProvider';

export function TypingIndicator() {
  const { strings } = useChatKitConfig();
  return (
    <div className="ck-message-enter flex items-center gap-1.5 py-1" aria-label={strings.typing}>
      <span className="ck-typing-dot" />
      <span className="ck-typing-dot" />
      <span className="ck-typing-dot" />
    </div>
  );
}
