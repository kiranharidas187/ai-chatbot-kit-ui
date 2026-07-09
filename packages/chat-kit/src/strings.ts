/**
 * All user-facing UI strings live here (and are overridable via
 * `config.strings`) so adding i18n later is a config concern, not a refactor.
 */
export interface UIStrings {
  newChat: string;
  renameSession: string;
  deleteSession: string;
  sessionListLabel: string;
  sendMessage: string;
  stopGenerating: string;
  retry: string;
  copy: string;
  copied: string;
  regenerate: string;
  feedbackUp: string;
  feedbackDown: string;
  micStart: string;
  micStop: string;
  micUnsupported: string;
  typing: string;
  errorGeneric: string;
  emptySessionTitle: string;
}

export const defaultStrings: UIStrings = {
  newChat: 'New chat',
  renameSession: 'Rename',
  deleteSession: 'Delete',
  sessionListLabel: 'Chat sessions',
  sendMessage: 'Send message',
  stopGenerating: 'Stop generating',
  retry: 'Retry',
  copy: 'Copy',
  copied: 'Copied',
  regenerate: 'Regenerate',
  feedbackUp: 'Good response',
  feedbackDown: 'Bad response',
  micStart: 'Start voice input',
  micStop: 'Stop voice input',
  micUnsupported: 'Voice input is not supported in this browser',
  typing: 'Typing…',
  errorGeneric: 'Something went wrong.',
  emptySessionTitle: 'New chat',
};
