import type { OutgoingMessage } from './types';

/**
 * Default JSON body shared by the built-in transports. Attachment blobs are
 * not JSON-serializable, so only their metadata travels; consumers who need
 * to upload file bytes should use the `body`/`buildMessage` hooks or a custom
 * transport.
 */
export function defaultRequestBody(message: OutgoingMessage): Record<string, unknown> {
  return {
    sessionId: message.sessionId,
    message: message.content,
    history: message.history,
    ...(message.attachments && message.attachments.length > 0
      ? {
          attachments: message.attachments.map(({ data: _data, ...meta }) => meta),
        }
      : {}),
  };
}
