import type { Message } from '../types';

/**
 * Normalize in-flight message states before persisting so a reload never
 * shows a message stuck "streaming": partial text becomes complete, an
 * unanswered pending/running state becomes an error the user can retry.
 */
export function sanitizeMessagesForSave(messages: Message[]): Message[] {
  return messages.map((message) => {
    if (message.kind === 'tool-call') {
      return message.status === 'running' ? { ...message, status: 'error' as const } : message;
    }
    if (message.status === 'streaming') return { ...message, status: 'complete' as const };
    if (message.status === 'pending') {
      return {
        ...message,
        status: 'error' as const,
        error: { message: 'Interrupted before completion.', retryable: true },
      };
    }
    return message;
  });
}
