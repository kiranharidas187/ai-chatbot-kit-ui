import { useChatKitConfig } from '../../state/ChatKitProvider';
import { useChat } from '../../state/useChat';
import { cx } from '../internal/cx';
import { MessageBubble } from './MessageBubble';
import { ToolCallItem } from './ToolCallItem';
import { TypingIndicator } from './TypingIndicator';
import { useAutoScroll } from './useAutoScroll';

export interface ChatMessagesProps {
  className?: string | undefined;
}

function WelcomeState() {
  const { branding } = useChatKitConfig();
  return (
    <div className="grid h-full place-items-center px-4">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        {branding.avatarUrl ? (
          <img src={branding.avatarUrl} alt="" className="size-12 rounded-full" />
        ) : (
          <div
            aria-hidden
            className="grid size-12 place-items-center rounded-full bg-accent text-lg font-semibold text-accent-foreground"
          >
            {branding.botName.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="text-muted-foreground">{branding.welcomeMessage}</p>
      </div>
    </div>
  );
}

/** Scrollable message history of the active session. */
export function ChatMessages({ className }: ChatMessagesProps) {
  const { messages, isGenerating, isTyping } = useChat();
  const { containerRef, onScroll } = useAutoScroll(messages);

  const last = messages[messages.length - 1];
  const waitingForReply =
    (isTyping || isGenerating) && (!last || last.kind !== 'text' || last.role !== 'assistant');

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      role="log"
      aria-live="polite"
      aria-busy={isGenerating}
      className={cx('flex-1 overflow-y-auto', className)}
    >
      {messages.length === 0 ? (
        <WelcomeState />
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
          {messages.map((message) =>
            message.kind === 'text' ? (
              <MessageBubble
                key={message.id}
                message={message}
                isLastAssistantMessage={message.id === last?.id && message.role === 'assistant'}
              />
            ) : (
              <ToolCallItem key={message.id} message={message} />
            ),
          )}
          {waitingForReply && <TypingIndicator />}
        </div>
      )}
    </div>
  );
}
