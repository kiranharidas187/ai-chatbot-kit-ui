/**
 * Core chat domain model shared by the state, transport, and persistence layers.
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export type TextMessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export type ToolCallStatus = 'running' | 'complete' | 'error';

export interface MessageError {
  message: string;
  /** Whether the UI should offer a retry action for this failure. */
  retryable: boolean;
}

export interface TextMessage {
  kind: 'text';
  id: string;
  role: MessageRole;
  content: string;
  /**
   * Intermediate reasoning streamed by agentic backends, rendered as a
   * collapsible block above the answer.
   */
  thinking?: string;
  status: TextMessageStatus;
  error?: MessageError;
  createdAt: number;
}

/**
 * Tool use by an agent is a first-class message kind, rendered distinctly from
 * plain text (collapsible input/output, running/complete/error states).
 */
export interface ToolCallMessage {
  kind: 'tool-call';
  id: string;
  role: 'assistant';
  toolCallId: string;
  toolName: string;
  input?: unknown;
  output?: unknown;
  status: ToolCallStatus;
  createdAt: number;
}

export type Message = TextMessage | ToolCallMessage;

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  /** Consumers upload files themselves and reference them by URL… */
  url?: string;
  /** …or hand the raw data to their transport adapter. */
  data?: Blob;
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}
