import { useState } from 'react';
import {
  CheckIcon,
  CopyIcon,
  RefreshIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '../../icons';
import { useChatKitConfig } from '../../state/ChatKitProvider';
import { useChat } from '../../state/useChat';
import type { TextMessage } from '../../types';
import { cx } from '../internal/cx';

export interface MessageActionsProps {
  message: TextMessage;
  /** Regenerate only makes sense on the conversation's last assistant answer. */
  isLastAssistantMessage: boolean;
}

/** Hover-revealed action row under a completed assistant message. */
export function MessageActions({ message, isLastAssistantMessage }: MessageActionsProps) {
  const { features, strings, onFeedback } = useChatKitConfig();
  const { regenerate, isGenerating } = useChat();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const actions = features.messageActions;
  const showCopy = actions.copy && typeof navigator !== 'undefined' && !!navigator.clipboard;
  const showRegenerate = actions.regenerate && isLastAssistantMessage;
  const showFeedback = actions.feedback;
  if (!showCopy && !showRegenerate && !showFeedback) return null;

  const copy = () => {
    void navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const giveFeedback = (value: 'up' | 'down') => {
    const next = feedback === value ? null : value;
    setFeedback(next);
    if (next) onFeedback?.(message, next);
  };

  const buttonClass =
    'grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground';

  return (
    <div
      className={cx(
        'mt-1.5 flex items-center gap-0.5 transition-opacity',
        'opacity-0 focus-within:opacity-100 group-hover:opacity-100',
      )}
    >
      {showCopy && (
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? strings.copied : strings.copy}
          title={copied ? strings.copied : strings.copy}
          className={buttonClass}
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </button>
      )}
      {showRegenerate && (
        <button
          type="button"
          onClick={regenerate}
          disabled={isGenerating}
          aria-label={strings.regenerate}
          title={strings.regenerate}
          className={buttonClass}
        >
          <RefreshIcon className="size-3.5" />
        </button>
      )}
      {showFeedback && (
        <>
          <button
            type="button"
            onClick={() => giveFeedback('up')}
            aria-label={strings.feedbackUp}
            aria-pressed={feedback === 'up'}
            title={strings.feedbackUp}
            className={cx(buttonClass, feedback === 'up' && 'text-accent')}
          >
            <ThumbsUpIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => giveFeedback('down')}
            aria-label={strings.feedbackDown}
            aria-pressed={feedback === 'down'}
            title={strings.feedbackDown}
            className={cx(buttonClass, feedback === 'down' && 'text-danger')}
          >
            <ThumbsDownIcon className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
