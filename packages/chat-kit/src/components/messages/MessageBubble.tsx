import { useChatKitConfig } from '../../state/ChatKitProvider';
import { useChat } from '../../state/useChat';
import type { TextMessage } from '../../types';
import { MarkdownContent } from './MarkdownContent';
import { MessageActions } from './MessageActions';
import { ThinkingDisclosure } from './ThinkingDisclosure';

function StreamingCursor() {
  return <span className="ck-cursor" aria-hidden />;
}

export interface MessageBubbleProps {
  message: TextMessage;
  isLastAssistantMessage?: boolean;
}

export function MessageBubble({ message, isLastAssistantMessage = false }: MessageBubbleProps) {
  const { strings, features } = useChatKitConfig();
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

  const streaming = message.status === 'streaming';
  return (
    <div className="ck-message-enter group">
      {message.thinking && (
        <ThinkingDisclosure thinking={message.thinking} active={streaming && !message.content} />
      )}
      {(message.content || streaming) && (
        <div className="text-assistant-bubble-foreground">
          {features.markdown ? (
            <MarkdownContent
              content={message.content}
              codeHighlighting={features.codeHighlighting}
            />
          ) : (
            <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
          )}
          {streaming && <StreamingCursor />}
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
      {message.status === 'complete' && message.content && (
        <MessageActions message={message} isLastAssistantMessage={isLastAssistantMessage} />
      )}
    </div>
  );
}
