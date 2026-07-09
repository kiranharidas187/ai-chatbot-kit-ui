/**
 * @kiranharidas/chat-kit — public API surface.
 *
 * Everything importable by consumers is exported from this file; anything not
 * exported here is internal and may change without notice.
 */

// Provider + hooks
export { ChatKitProvider, useChatKitConfig } from './state/ChatKitProvider';
export type { ChatKitProviderProps } from './state/ChatKitProvider';
export { useChat } from './state/useChat';
export type { UseChatResult } from './state/useChat';

// Components
export { ChatWindow } from './components/ChatWindow';
export type { ChatWindowProps } from './components/ChatWindow';
export { ChatMessages } from './components/messages/ChatMessages';
export type { ChatMessagesProps } from './components/messages/ChatMessages';
export { ChatComposer } from './components/composer/ChatComposer';
export type { ChatComposerProps } from './components/composer/ChatComposer';

// Built-in transports
export { createEchoTransport } from './transport/echo';
export type { EchoTransportOptions } from './transport/echo';

// Config
export { defineConfig } from './config/defineConfig';
export { defaultConfig } from './config/defaults';
export type {
  BrandingConfig,
  ChatKitConfig,
  FeaturesConfig,
  MessageActionsConfig,
  PersistenceChoice,
  ResolvedChatKitConfig,
  SessionsConfig,
  SpeechConfig,
} from './config/types';

// Theme
export { defaultTheme } from './theme/defaultTheme';
export type {
  ChatTheme,
  ResolvedTheme,
  ThemeColors,
  ThemeMode,
  ThemeRadius,
  ThemeSpacing,
  ThemeTypography,
} from './theme/types';

// Transport
export type {
  ChatEvent,
  OutgoingMessage,
  RetryPolicy,
  TransportAdapter,
  TransportConfig,
  TransportContext,
} from './transport/types';

// Persistence
export type { PersistenceAdapter } from './persistence/types';

// Speech
export type { SpeechAdapter, SpeechResult, SpeechStartOptions } from './speech/types';

// Core domain model
export type {
  Attachment,
  Message,
  MessageError,
  MessageRole,
  Session,
  TextMessage,
  TextMessageStatus,
  ToolCallMessage,
  ToolCallStatus,
} from './types';

// Strings
export type { UIStrings } from './strings';

export const VERSION = '0.0.0';
