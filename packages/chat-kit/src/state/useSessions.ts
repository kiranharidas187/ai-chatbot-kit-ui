import { useCallback } from 'react';
import type { Session } from '../types';
import { newId } from '../utils/newId';
import { useChatKitConfig, useChatKitStore } from './ChatKitProvider';

export interface UseSessionsResult {
  /** All sessions, most recently updated first. */
  sessions: Session[];
  activeSessionId: string | null;
  createSession: () => void;
  renameSession: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  switchSession: (sessionId: string) => void;
}

/** Session management for the sidebar (create / rename / delete / switch). */
export function useSessions(): UseSessionsResult {
  const config = useChatKitConfig();
  const { state, dispatch, aborts, ensureMessagesLoaded } = useChatKitStore();

  const sessions = [...state.sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  const createSession = useCallback(() => {
    // Reuse an existing empty session instead of stacking blank chats.
    const empty = state.sessions.find((s) => (state.messagesBySession[s.id]?.length ?? 0) === 0);
    if (empty) {
      dispatch({ type: 'SESSION_ACTIVATED', sessionId: empty.id });
      return;
    }
    // Enforce maxSessions by evicting the least recently updated.
    if (state.sessions.length >= config.sessions.maxSessions) {
      const oldest = [...state.sessions].sort((a, b) => a.updatedAt - b.updatedAt)[0];
      if (oldest) {
        aborts.get(oldest.id)?.abort();
        dispatch({ type: 'SESSION_DELETED', sessionId: oldest.id });
      }
    }
    const now = Date.now();
    dispatch({
      type: 'SESSION_CREATED',
      session: {
        id: newId(),
        title: config.strings.emptySessionTitle,
        createdAt: now,
        updatedAt: now,
      },
    });
  }, [state.sessions, state.messagesBySession, dispatch, aborts, config]);

  const renameSession = useCallback(
    (sessionId: string, title: string) => {
      const trimmed = title.trim();
      if (trimmed) dispatch({ type: 'SESSION_RENAMED', sessionId, title: trimmed });
    },
    [dispatch],
  );

  const deleteSession = useCallback(
    (sessionId: string) => {
      aborts.get(sessionId)?.abort();
      dispatch({ type: 'SESSION_DELETED', sessionId });
      // Never leave the UI without an active session.
      if (state.sessions.length <= 1) {
        const now = Date.now();
        dispatch({
          type: 'SESSION_CREATED',
          session: {
            id: newId(),
            title: config.strings.emptySessionTitle,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    },
    [dispatch, aborts, state.sessions.length, config.strings.emptySessionTitle],
  );

  const switchSession = useCallback(
    (sessionId: string) => {
      ensureMessagesLoaded(sessionId);
      dispatch({ type: 'SESSION_ACTIVATED', sessionId });
    },
    [dispatch, ensureMessagesLoaded],
  );

  return {
    sessions,
    activeSessionId: state.activeSessionId,
    createSession,
    renameSession,
    deleteSession,
    switchSession,
  };
}
