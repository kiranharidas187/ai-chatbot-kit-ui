import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { resolveConfig } from '../config/resolveConfig';
import type { ChatKitConfig, ResolvedChatKitConfig } from '../config/types';
import { resolvePersistence } from '../persistence/resolvePersistence';
import { resolveTransport } from '../transport/resolveTransport';
import type { TransportAdapter } from '../transport/types';
import { newId } from '../utils/newId';
import { chatReducer, emptyChatState } from './chatReducer';
import type { ChatAction, ChatState } from './types';
import { usePersistenceSync } from './usePersistenceSync';

const ConfigContext = createContext<ResolvedChatKitConfig | null>(null);

interface ChatKitStore {
  state: ChatState;
  dispatch: Dispatch<ChatAction>;
  transport: TransportAdapter;
  /** In-flight turn controllers, keyed by session id. */
  aborts: Map<string, AbortController>;
  /** Lazy-load a session's history from persistence (no-op if already loaded). */
  ensureMessagesLoaded: (sessionId: string) => void;
}

const StoreContext = createContext<ChatKitStore | null>(null);

export interface ChatKitProviderProps {
  config?: ChatKitConfig;
  children: ReactNode;
}

function initialChatState(defaultTitle: string): ChatState {
  const now = Date.now();
  const session = { id: newId(), title: defaultTitle, createdAt: now, updatedAt: now };
  return {
    ...emptyChatState,
    sessions: [session],
    activeSessionId: session.id,
    messagesBySession: { [session.id]: [] },
  };
}

/**
 * Wrap your app (or the subtree hosting the chat UI) once. Holds the resolved
 * config plus all session/message state.
 */
export function ChatKitProvider({ config, children }: ChatKitProviderProps) {
  const resolved = useMemo(() => resolveConfig(config), [config]);
  const [state, dispatch] = useReducer(
    chatReducer,
    resolved.strings.emptySessionTitle,
    initialChatState,
  );
  const transport = useMemo(() => resolveTransport(resolved.transport), [resolved.transport]);
  const persistence = useMemo(
    () => resolvePersistence(resolved.sessions.persistence),
    [resolved.sessions.persistence],
  );
  const [aborts] = useState(() => new Map<string, AbortController>());

  const { ensureMessagesLoaded } = usePersistenceSync(
    persistence,
    state,
    dispatch,
    resolved.strings.emptySessionTitle,
  );

  const store = useMemo<ChatKitStore>(
    () => ({ state, dispatch, transport, aborts, ensureMessagesLoaded }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ensureMessagesLoaded is stable in behavior
    [state, transport, aborts],
  );

  // Unsolicited server pushes (e.g. typing indicators over WebSocket).
  useEffect(() => {
    return transport.onServerEvent?.((sessionId, event) => {
      if (event.type === 'typing') {
        dispatch({ type: 'TYPING_SET', sessionId, active: event.active });
      }
    });
  }, [transport]);

  return (
    <ConfigContext.Provider value={resolved}>
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    </ConfigContext.Provider>
  );
}

export function useChatKitConfig(): ResolvedChatKitConfig {
  const value = useContext(ConfigContext);
  if (!value) {
    throw new Error('ChatKit components must be rendered inside <ChatKitProvider>.');
  }
  return value;
}

/** Internal store access — not part of the public API. */
export function useChatKitStore(): ChatKitStore {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error('ChatKit components must be rendered inside <ChatKitProvider>.');
  }
  return value;
}
