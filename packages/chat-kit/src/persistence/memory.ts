import type { Message, Session } from '../types';
import type { PersistenceAdapter } from './types';

/** In-memory persistence: state survives re-renders but not reloads. */
export function memoryPersistence(): PersistenceAdapter {
  const sessions = new Map<string, Session>();
  const messages = new Map<string, Message[]>();

  return {
    loadSessions: () => Promise.resolve([...sessions.values()]),
    saveSession: (session) => {
      sessions.set(session.id, session);
      return Promise.resolve();
    },
    deleteSession: (sessionId) => {
      sessions.delete(sessionId);
      messages.delete(sessionId);
      return Promise.resolve();
    },
    loadMessages: (sessionId) => Promise.resolve(messages.get(sessionId) ?? []),
    saveMessages: (sessionId, list) => {
      messages.set(sessionId, list);
      return Promise.resolve();
    },
  };
}
