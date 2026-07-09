import type { PersistenceAdapter } from '../persistence/types';
import type { SpeechAdapter } from '../speech/types';
import type { UIStrings } from '../strings';
import type { ChatTheme, ResolvedTheme } from '../theme/types';
import type { TransportConfig } from '../transport/types';
import type { TextMessage } from '../types';

export interface BrandingConfig {
  botName?: string;
  avatarUrl?: string;
  welcomeMessage?: string;
  inputPlaceholder?: string;
}

export interface MessageActionsConfig {
  copy?: boolean;
  regenerate?: boolean;
  feedback?: boolean;
}

export interface FeaturesConfig {
  mic?: boolean;
  attachments?: boolean;
  markdown?: boolean;
  codeHighlighting?: boolean;
  messageActions?: MessageActionsConfig;
}

export type PersistenceChoice = 'localStorage' | 'memory' | PersistenceAdapter;

export interface SessionsConfig {
  maxSessions?: number;
  persistence?: PersistenceChoice;
}

export interface SpeechConfig {
  /** Custom STT provider; defaults to the browser's Web Speech API. */
  adapter?: SpeechAdapter;
  lang?: string;
}

/**
 * The single config object driving the whole chat UI. Every field is optional;
 * values are deep-merged over `defaultConfig`.
 */
export interface ChatKitConfig {
  branding?: BrandingConfig;
  theme?: ChatTheme;
  transport?: TransportConfig;
  features?: FeaturesConfig;
  sessions?: SessionsConfig;
  speech?: SpeechConfig;
  strings?: Partial<UIStrings>;
  /** Called when the user rates an assistant message (requires `features.messageActions.feedback`). */
  onFeedback?: (message: TextMessage, feedback: 'up' | 'down') => void;
}

/** Config after defaults are applied — what components consume via context. */
export interface ResolvedChatKitConfig {
  branding: {
    botName: string;
    avatarUrl?: string;
    welcomeMessage: string;
    inputPlaceholder: string;
  };
  theme: ResolvedTheme;
  /** Absent means no backend configured; the provider falls back to a demo echo transport. */
  transport?: TransportConfig;
  features: {
    mic: boolean;
    attachments: boolean;
    markdown: boolean;
    codeHighlighting: boolean;
    messageActions: Required<MessageActionsConfig>;
  };
  sessions: {
    maxSessions: number;
    persistence: PersistenceChoice;
  };
  speech: {
    adapter?: SpeechAdapter;
    lang: string;
  };
  strings: UIStrings;
  onFeedback?: (message: TextMessage, feedback: 'up' | 'down') => void;
}
