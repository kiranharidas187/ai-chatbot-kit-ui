import { useCallback, useMemo } from 'react';
import type { Message, TextMessage } from '../types';
import { newId } from '../utils/newId';
import { useChatKitConfig, useChatKitStore } from './ChatKitProvider';
import { runTurn } from './runTurn';

export interface UseChatResult {
  /** Messages of the active session, oldest first. */
  messages: Message[];
  /** True while the assistant is answering in the active session. */
  isGenerating: boolean;
  /** Server-driven typing indicator for the active session. */
  isTyping: boolean;
  sendMessage: (content: string) => void;
  stopGenerating: () => void;
  /** Retry after a failed turn: drops the errored answer and re-runs the last user message. */
  retry: () => void;
  /** Regenerate the last assistant answer (same mechanics as retry). */
  regenerate: () => void;
}

const NO_MESSAGES: Message[] = [];

/** Chat interaction for the active session. */
export function useChat(): UseChatResult {
  const config = useChatKitConfig();
  const { state, dispatch, transport, aborts } = useChatKitStore();

  const sessionId = state.activeSessionId;
  const messages = (sessionId && state.messagesBySession[sessionId]) || NO_MESSAGES;
  const isGenerating = Boolean(sessionId && state.generatingBySession[sessionId]);
  const isTyping = Boolean(sessionId && state.typingBySession[sessionId]);

  const headers = useMemo(() => {
    const transportConfig = config.transport;
    return transportConfig && 'headers' in transportConfig ? (transportConfig.headers ?? {}) : {};
  }, [config.transport]);

  const startTurn = useCallback(
    (content: string, history: Message[]) => {
      if (!sessionId) return;
      dispatch({ type: 'TURN_STARTED', sessionId });
      const controller = new AbortController();
      aborts.set(sessionId, controller);
      void runTurn({
        transport,
        dispatch,
        sessionId,
        content,
        history,
        headers,
        signal: controller.signal,
        errorFallbackText: config.strings.errorGeneric,
      }).finally(() => {
        if (aborts.get(sessionId) === controller) aborts.delete(sessionId);
      });
    },
    [sessionId, dispatch, transport, aborts, headers, config.strings.errorGeneric],
  );

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !sessionId || isGenerating) return;

      const userMessage: TextMessage = {
        kind: 'text',
        id: newId(),
        role: 'user',
        content: trimmed,
        status: 'complete',
        createdAt: Date.now(),
      };
      dispatch({ type: 'MESSAGE_ADDED', sessionId, message: userMessage });

      // First message titles the session, ChatGPT-style.
      if (messages.length === 0) {
        dispatch({ type: 'SESSION_RENAMED', sessionId, title: trimmed.slice(0, 40) });
      }

      startTurn(trimmed, [...messages, userMessage]);
    },
    [sessionId, isGenerating, dispatch, messages, startTurn],
  );

  const stopGenerating = useCallback(() => {
    if (sessionId) aborts.get(sessionId)?.abort();
  }, [sessionId, aborts]);

  const retry = useCallback(() => {
    if (!sessionId || isGenerating) return;
    // Find the last user message; everything after it is the failed answer.
    const lastUserIndex = messages.findLastIndex((m) => m.kind === 'text' && m.role === 'user');
    if (lastUserIndex === -1) return;
    const lastUser = messages[lastUserIndex] as TextMessage;
    const after = messages[lastUserIndex + 1];
    if (after) dispatch({ type: 'MESSAGES_TRUNCATED', sessionId, fromMessageId: after.id });
    startTurn(lastUser.content, messages.slice(0, lastUserIndex + 1));
  }, [sessionId, isGenerating, messages, dispatch, startTurn]);

  return { messages, isGenerating, isTyping, sendMessage, stopGenerating, retry, regenerate: retry };
}
