import type { Message, Session } from '../types';

/**
 * Storage for sessions and their message history. All methods are async so
 * implementations can be backed by localStorage, IndexedDB, or a remote API.
 */
export interface PersistenceAdapter {
  loadSessions(): Promise<Session[]>;
  saveSession(session: Session): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  loadMessages(sessionId: string): Promise<Message[]>;
  /** Called (debounced by the provider) with the session's full message list. */
  saveMessages(sessionId: string, messages: Message[]): Promise<void>;
}
