import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { resolveConfig } from '../config/resolveConfig';
import type { ChatKitConfig, ResolvedChatKitConfig } from '../config/types';

const ConfigContext = createContext<ResolvedChatKitConfig | null>(null);

export interface ChatKitProviderProps {
  config?: ChatKitConfig;
  children: ReactNode;
}

/**
 * Wrap your app (or the subtree hosting the chat UI) once. Holds the resolved
 * config; session/message state joins in M3.
 */
export function ChatKitProvider({ config, children }: ChatKitProviderProps) {
  const resolved = useMemo(() => resolveConfig(config), [config]);
  return <ConfigContext.Provider value={resolved}>{children}</ConfigContext.Provider>;
}

export function useChatKitConfig(): ResolvedChatKitConfig {
  const value = useContext(ConfigContext);
  if (!value) {
    throw new Error('ChatKit components must be rendered inside <ChatKitProvider>.');
  }
  return value;
}
