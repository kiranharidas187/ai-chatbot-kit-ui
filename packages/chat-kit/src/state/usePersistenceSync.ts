import { useEffect, useRef, useState, type Dispatch } from 'react';
import type { PersistenceAdapter } from '../persistence/types';
import { sanitizeMessagesForSave } from '../persistence/sanitize';
import type { Message, Session } from '../types';
import { newId } from '../utils/newId';
import type { ChatAction, ChatState } from './types';

const SAVE_DEBOUNCE_MS = 400;

export interface PersistenceSync {
  hydrated: boolean;
  /** Load a session's messages once (used when switching to a not-yet-loaded session). */
  ensureMessagesLoaded: (sessionId: string) => void;
}

/**
 * Two-way sync between chat state and the persistence adapter:
 * hydrate once on mount, then mirror changes back — sessions on every change,
 * messages debounced (streaming produces a delta per frame).
 * Sessions without any message are UI-only and never persisted.
 */
export function usePersistenceSync(
  persistence: PersistenceAdapter,
  state: ChatState,
  dispatch: Dispatch<ChatAction>,
  defaultTitle: string,
): PersistenceSync {
  // Hydration is tracked per adapter instance, so swapping the adapter at
  // runtime re-hydrates without a synchronous state reset in the effect.
  const [hydratedFor, setHydratedFor] = useState<PersistenceAdapter | null>(null);
  const hydrated = hydratedFor === persistence;
  const savedSessions = useRef(new Map<string, Session>());
  const savedMessages = useRef(new Map<string, Message[]>());
  const loadedSessions = useRef(new Set<string>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate once per adapter instance.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let sessions: Session[] = [];
      try {
        sessions = [...(await persistence.loadSessions())].sort((a, b) => b.updatedAt - a.updatedAt);
      } catch {
        // Unreadable storage: start fresh rather than crash the UI.
      }
      if (cancelled) return;

      if (sessions.length === 0) {
        setHydratedFor(persistence);
        return; // keep the provider's initial (unpersisted) default session
      }

      const active = sessions[0]!;
      let messages: Message[] = [];
      try {
        messages = await persistence.loadMessages(active.id);
      } catch {
        // fall through with empty history
      }
      if (cancelled) return;

      // A fresh empty session on top keeps "open the app, start typing" flowing.
      const fresh: Session = {
        id: newId(),
        title: defaultTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      savedSessions.current = new Map(sessions.map((s) => [s.id, s]));
      savedMessages.current = new Map([[active.id, messages]]);
      loadedSessions.current = new Set([active.id, fresh.id]);
      dispatch({ type: 'SESSIONS_LOADED', sessions: [fresh, ...sessions], activeSessionId: fresh.id });
      dispatch({ type: 'MESSAGES_LOADED', sessionId: active.id, messages });
      dispatch({ type: 'MESSAGES_LOADED', sessionId: fresh.id, messages: [] });
      setHydratedFor(persistence);
    })();
    return () => {
      cancelled = true;
    };
  }, [persistence, dispatch, defaultTitle]);

  // Mirror session metadata changes (create/rename/touch/delete).
  useEffect(() => {
    if (!hydrated) return;
    const seen = new Set<string>();
    for (const session of state.sessions) {
      seen.add(session.id);
      const hasMessages = (state.messagesBySession[session.id]?.length ?? 0) > 0;
      if (!hasMessages) continue;
      if (savedSessions.current.get(session.id) !== session) {
        savedSessions.current.set(session.id, session);
        void persistence.saveSession(session).catch(() => {});
      }
    }
    for (const id of [...savedSessions.current.keys()]) {
      if (!seen.has(id)) {
        savedSessions.current.delete(id);
        savedMessages.current.delete(id);
        void persistence.deleteSession(id).catch(() => {});
      }
    }
  }, [hydrated, state.sessions, state.messagesBySession, persistence]);

  // Mirror message changes, debounced.
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      for (const [sessionId, messages] of Object.entries(state.messagesBySession)) {
        if (messages.length === 0) continue;
        if (!state.sessions.some((s) => s.id === sessionId)) continue;
        if (savedMessages.current.get(sessionId) === messages) continue;
        savedMessages.current.set(sessionId, messages);
        void persistence.saveMessages(sessionId, sanitizeMessagesForSave(messages)).catch(() => {});
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [hydrated, state.messagesBySession, state.sessions, persistence]);

  const ensureMessagesLoaded = (sessionId: string) => {
    if (loadedSessions.current.has(sessionId)) return;
    loadedSessions.current.add(sessionId);
    void persistence
      .loadMessages(sessionId)
      .then((messages) => {
        savedMessages.current.set(sessionId, messages);
        dispatch({ type: 'MESSAGES_LOADED', sessionId, messages });
      })
      .catch(() => {
        loadedSessions.current.delete(sessionId);
      });
  };

  return { hydrated, ensureMessagesLoaded };
}
