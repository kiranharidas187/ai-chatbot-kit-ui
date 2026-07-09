import { useChatKitConfig } from '../../state/ChatKitProvider';
import { useChat } from '../../state/useChat';
import type { TextMessage } from '../../types';

function StreamingCursor() {
  return <span className="ck-cursor" aria-hidden />;
}

export function MessageBubble({ message }: { message: TextMessage }) {
  const { strings } = useChatKitConfig();
  const { retry, isGenerating } = useChat();

  if (message.role === 'user') {
    return (
      <div className="ck-message-enter flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-bubble bg-user-bubble px-4 py-2.5 text-user-bubble-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === 'system') {
    return (
      <div className="ck-message-enter self-center rounded-md bg-surface px-3 py-1 text-sm text-muted-foreground">
        {message.content}
      </div>
    );
  }

  // Assistant. Markdown rendering replaces the plain text in M6.
  return (
    <div className="ck-message-enter">
      {(message.content || message.status === 'streaming') && (
        <div className="whitespace-pre-wrap leading-relaxed text-assistant-bubble-foreground">
          {message.content}
          {message.status === 'streaming' && <StreamingCursor />}
        </div>
      )}
      {message.status === 'error' && (
        <div className="mt-2 flex items-center gap-3 rounded-md border border-danger/40 px-3 py-2 text-sm">
          <span className="text-danger">{message.error?.message ?? strings.errorGeneric}</span>
          {message.error?.retryable !== false && (
            <button
              type="button"
              onClick={retry}
              disabled={isGenerating}
              className="shrink-0 rounded-sm px-2 py-0.5 font-medium text-foreground hover:bg-surface-hover"
            >
              {strings.retry}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
