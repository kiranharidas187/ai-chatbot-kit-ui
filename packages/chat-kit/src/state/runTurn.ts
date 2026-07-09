import type { Dispatch } from 'react';
import type { Attachment, Message } from '../types';
import type { TransportAdapter } from '../transport/types';
import { newId } from '../utils/newId';
import type { ChatAction } from './types';

export interface RunTurnOptions {
  transport: TransportAdapter;
  dispatch: Dispatch<ChatAction>;
  sessionId: string;
  content: string;
  attachments?: Attachment[];
  /** Session history including the user message that starts this turn. */
  history: Message[];
  headers: Record<string, string>;
  signal: AbortSignal;
  errorFallbackText: string;
}

/**
 * Drive one assistant turn: consume the transport's ChatEvent stream and fold
 * it into reducer actions. Text/thinking deltas accumulate on an assistant
 * message; tool calls become separate messages; a tool call closes the current
 * text message so following text starts a fresh one (agentic interleaving).
 */
export async function runTurn(options: RunTurnOptions): Promise<void> {
  const {
    transport,
    dispatch,
    sessionId,
    content,
    attachments,
    history,
    headers,
    signal,
    errorFallbackText,
  } = options;

  let currentTextId: string | null = null;

  const ensureTextMessage = (): string => {
    if (!currentTextId) {
      currentTextId = newId();
      dispatch({
        type: 'MESSAGE_ADDED',
        sessionId,
        message: {
          kind: 'text',
          id: currentTextId,
          role: 'assistant',
          content: '',
          status: 'streaming',
          createdAt: Date.now(),
        },
      });
    }
    return currentTextId;
  };

  const closeTextMessage = (status: 'complete' | 'error', errorMessage?: string) => {
    if (!currentTextId) return;
    dispatch({
      type: 'MESSAGE_STATUS',
      sessionId,
      messageId: currentTextId,
      status,
      ...(status === 'error'
        ? { error: { message: errorMessage ?? errorFallbackText, retryable: true } }
        : {}),
    });
    currentTextId = null;
  };

  try {
    const stream = transport.sendMessage(
      { sessionId, content, history, ...(attachments ? { attachments } : {}) },
      { sessionId, signal, headers },
    );

    for await (const event of stream) {
      if (signal.aborted) break;
      switch (event.type) {
        case 'text-delta':
          dispatch({ type: 'TEXT_DELTA', sessionId, messageId: ensureTextMessage(), delta: event.delta });
          break;
        case 'text': {
          const id = ensureTextMessage();
          dispatch({ type: 'TEXT_SET', sessionId, messageId: id, content: event.content });
          closeTextMessage('complete');
          break;
        }
        case 'thinking-delta':
          dispatch({
            type: 'THINKING_DELTA',
            sessionId,
            messageId: ensureTextMessage(),
            delta: event.delta,
          });
          break;
        case 'tool-call-start':
          // Interleaved agentic output: finish the text so far, then record the tool call.
          closeTextMessage('complete');
          dispatch({
            type: 'MESSAGE_ADDED',
            sessionId,
            message: {
              kind: 'tool-call',
              id: newId(),
              role: 'assistant',
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              ...(event.input !== undefined ? { input: event.input } : {}),
              status: 'running',
              createdAt: Date.now(),
            },
          });
          break;
        case 'tool-call-result':
          dispatch({
            type: 'TOOL_CALL_RESULT',
            sessionId,
            toolCallId: event.toolCallId,
            ...(event.output !== undefined ? { output: event.output } : {}),
            ...(event.isError !== undefined ? { isError: event.isError } : {}),
          });
          break;
        case 'typing':
          dispatch({ type: 'TYPING_SET', sessionId, active: event.active });
          break;
        case 'error':
          ensureTextMessage();
          closeTextMessage('error', event.message);
          break;
        case 'done':
          break;
      }
    }
    closeTextMessage('complete');
  } catch (err) {
    if (signal.aborted) {
      // User pressed stop: whatever streamed so far stands as the answer.
      closeTextMessage('complete');
    } else {
      ensureTextMessage();
      closeTextMessage('error', err instanceof Error ? err.message : undefined);
    }
  } finally {
    dispatch({ type: 'TURN_FINISHED', sessionId });
  }
}
