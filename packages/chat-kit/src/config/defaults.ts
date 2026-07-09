import { defaultStrings } from '../strings';
import { defaultTheme } from '../theme/defaultTheme';
import type { ResolvedChatKitConfig } from './types';

export const defaultConfig: ResolvedChatKitConfig = {
  branding: {
    botName: 'Assistant',
    welcomeMessage: 'Hi! How can I help you today?',
    inputPlaceholder: 'Type a message…',
  },
  theme: defaultTheme,
  features: {
    mic: true,
    attachments: false,
    markdown: true,
    codeHighlighting: true,
    messageActions: {
      copy: true,
      regenerate: true,
      feedback: false,
    },
  },
  sessions: {
    maxSessions: 50,
    persistence: 'localStorage',
  },
  speech: {
    lang: 'en-US',
  },
  strings: defaultStrings,
};
