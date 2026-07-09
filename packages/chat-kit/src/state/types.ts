import type { Message, MessageError, Session, TextMessageStatus } from '../types';

export interface ChatState {
  sessions: Session[];
  activeSessionId: string | null;
  messagesBySession: Record<string, Message[]>;
  /** True while a turn is in flight for a session (drives stop button / disabled send). */
  generatingBySession: Record<string, boolean>;
  /** Server-driven typing indicator state. */
  typingBySession: Record<string, boolean>;
}

export type ChatAction =
  | { type: 'SESSIONS_LOADED'; sessions: Session[]; activeSessionId: string | null }
  | { type: 'SESSION_CREATED'; session: Session }
  | { type: 'SESSION_RENAMED'; sessionId: string; title: string }
  | { type: 'SESSION_DELETED'; sessionId: string }
  | { type: 'SESSION_ACTIVATED'; sessionId: string }
  | { type: 'MESSAGES_LOADED'; sessionId: string; messages: Message[] }
  | { type: 'MESSAGE_ADDED'; sessionId: string; message: Message }
  | { type: 'TEXT_DELTA'; sessionId: string; messageId: string; delta: string }
  | { type: 'THINKING_DELTA'; sessionId: string; messageId: string; delta: string }
  | { type: 'TEXT_SET'; sessionId: string; messageId: string; content: string }
  | {
      type: 'MESSAGE_STATUS';
      sessionId: string;
      messageId: string;
      status: TextMessageStatus;
      error?: MessageError;
    }
  | {
      type: 'TOOL_CALL_RESULT';
      sessionId: string;
      toolCallId: string;
      output?: unknown;
      isError?: boolean;
    }
  | { type: 'TYPING_SET'; sessionId: string; active: boolean }
  | { type: 'TURN_STARTED'; sessionId: string }
  | { type: 'TURN_FINISHED'; sessionId: string }
  /** Remove a message and everything after it (retry / regenerate). */
  | { type: 'MESSAGES_TRUNCATED'; sessionId: string; fromMessageId: string };
