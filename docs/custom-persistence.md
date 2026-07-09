# Writing a custom persistence adapter

By default ChatKit stores sessions and messages in `localStorage`. To store them in your
own backend/DB instead, implement `PersistenceAdapter` and pass it in config:

```ts
const config = defineConfig({
  sessions: { persistence: myAdapter },
});
```

## The interface

```ts
import type { PersistenceAdapter, Session, Message } from '@kiranharidas/chat-kit';

interface PersistenceAdapter {
  loadSessions(): Promise<Session[]>;
  saveSession(session: Session): Promise<void>;      // upsert by session.id
  deleteSession(sessionId: string): Promise<void>;   // also drop its messages
  loadMessages(sessionId: string): Promise<Message[]>;
  saveMessages(sessionId: string, messages: Message[]): Promise<void>; // full list, debounced
}
```

## How ChatKit calls it

- **Hydration (mount):** `loadSessions()` once. If any exist, they're sorted by
  `updatedAt` and shown in the sidebar, the most recent session's messages are loaded,
  and a fresh empty session is placed on top. Other sessions' messages load lazily on
  first switch.
- **Saves:** `saveSession` fires on create/rename/activity (object changed);
  `saveMessages` is debounced (~400 ms) and receives the session's **full** message
  list — streaming does not hammer your API per token. Sessions with zero messages are
  never persisted.
- **Sanitization:** before `saveMessages`, in-flight statuses are normalized
  (streaming → complete, pending/running → retryable error) and attachment `Blob`s are
  stripped to metadata — what you store is always JSON-safe and reload-safe.
- **Failures:** adapter rejections are swallowed — the chat keeps working, persistence
  degrades. Log inside your adapter if you need visibility.

## Example: REST backend

```ts
import type { Message, PersistenceAdapter, Session } from '@kiranharidas/chat-kit';

export function restPersistence(baseUrl: string, headers: Record<string, string>): PersistenceAdapter {
  const http = async (path: string, init?: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { 'content-type': 'application/json', ...headers },
      ...init,
    });
    if (!response.ok) throw new Error(`persistence ${path} → ${response.status}`);
    return response;
  };

  return {
    loadSessions: async () => (await http('/sessions')).json() as Promise<Session[]>,
    saveSession: async (session) => {
      await http(`/sessions/${session.id}`, { method: 'PUT', body: JSON.stringify(session) });
    },
    deleteSession: async (sessionId) => {
      await http(`/sessions/${sessionId}`, { method: 'DELETE' });
    },
    loadMessages: async (sessionId) =>
      (await http(`/sessions/${sessionId}/messages`)).json() as Promise<Message[]>,
    saveMessages: async (sessionId, messages) => {
      await http(`/sessions/${sessionId}/messages`, {
        method: 'PUT',
        body: JSON.stringify(messages),
      });
    },
  };
}
```

## Notes

- **Identity:** treat `session.id` / `message.id` as opaque client-generated UUIDs.
- **Multi-user:** scope storage by your authenticated user server-side; ChatKit doesn't
  know about users.
- **Namespacing localStorage:** if you just need a different key prefix (two ChatKit
  apps on one origin), use the built-in factory instead of a custom adapter:
  `sessions: { persistence: localStoragePersistence({ prefix: 'my-app' }) }`.
