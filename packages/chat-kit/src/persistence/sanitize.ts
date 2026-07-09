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
    let result = message;
    // Blobs don't survive JSON storage; keep attachment metadata only.
    if (result.attachments?.some((a) => a.data !== undefined)) {
      result = {
        ...result,
        attachments: result.attachments.map(({ data: _data, ...meta }) => meta),
      };
    }
    if (result.status === 'streaming') return { ...result, status: 'complete' as const };
    if (result.status === 'pending') {
      return {
        ...result,
        status: 'error' as const,
        error: { message: 'Interrupted before completion.', retryable: true },
      };
    }
    return result;
  });
}
