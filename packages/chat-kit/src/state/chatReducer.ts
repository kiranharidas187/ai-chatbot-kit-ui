import type { Message } from '../types';
import type { ChatAction, ChatState } from './types';

export const emptyChatState: ChatState = {
  sessions: [],
  activeSessionId: null,
  messagesBySession: {},
  generatingBySession: {},
  typingBySession: {},
};

function mapSessionMessages(
  state: ChatState,
  sessionId: string,
  fn: (message: Message) => Message,
): ChatState {
  const messages = state.messagesBySession[sessionId];
  if (!messages) return state;
  return {
    ...state,
    messagesBySession: { ...state.messagesBySession, [sessionId]: messages.map(fn) },
  };
}

function touchSession(state: ChatState, sessionId: string, at: number): ChatState {
  return {
    ...state,
    sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, updatedAt: at } : s)),
  };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SESSIONS_LOADED':
      return {
        ...state,
        sessions: action.sessions,
        activeSessionId: action.activeSessionId,
      };

    case 'SESSION_CREATED':
      return {
        ...state,
        sessions: [action.session, ...state.sessions],
        activeSessionId: action.session.id,
        messagesBySession: { ...state.messagesBySession, [action.session.id]: [] },
      };

    case 'SESSION_RENAMED':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId ? { ...s, title: action.title } : s,
        ),
      };

    case 'SESSION_DELETED': {
      const sessions = state.sessions.filter((s) => s.id !== action.sessionId);
      const { [action.sessionId]: _messages, ...messagesBySession } = state.messagesBySession;
      const { [action.sessionId]: _generating, ...generatingBySession } =
        state.generatingBySession;
      const { [action.sessionId]: _typing, ...typingBySession } = state.typingBySession;
      const activeSessionId =
        state.activeSessionId === action.sessionId
          ? (sessions[0]?.id ?? null)
          : state.activeSessionId;
      return { sessions, activeSessionId, messagesBySession, generatingBySession, typingBySession };
    }

    case 'SESSION_ACTIVATED':
      return { ...state, activeSessionId: action.sessionId };

    case 'MESSAGES_LOADED':
      return {
        ...state,
        messagesBySession: { ...state.messagesBySession, [action.sessionId]: action.messages },
      };

    case 'MESSAGE_ADDED': {
      const messages = state.messagesBySession[action.sessionId] ?? [];
      const next: ChatState = {
        ...state,
        messagesBySession: {
          ...state.messagesBySession,
          [action.sessionId]: [...messages, action.message],
        },
      };
      return touchSession(next, action.sessionId, action.message.createdAt);
    }

    case 'TEXT_DELTA':
      return mapSessionMessages(state, action.sessionId, (m) =>
        m.id === action.messageId && m.kind === 'text'
          ? { ...m, content: m.content + action.delta, status: 'streaming' }
          : m,
      );

    case 'THINKING_DELTA':
      return mapSessionMessages(state, action.sessionId, (m) =>
        m.id === action.messageId && m.kind === 'text'
          ? { ...m, thinking: (m.thinking ?? '') + action.delta, status: 'streaming' }
          : m,
      );

    case 'TEXT_SET':
      return mapSessionMessages(state, action.sessionId, (m) =>
        m.id === action.messageId && m.kind === 'text' ? { ...m, content: action.content } : m,
      );

    case 'MESSAGE_STATUS':
      return mapSessionMessages(state, action.sessionId, (m) => {
        if (m.id !== action.messageId || m.kind !== 'text') return m;
        const { error: _dropped, ...rest } = m;
        return action.error
          ? { ...rest, status: action.status, error: action.error }
          : { ...rest, status: action.status };
      });

    case 'TOOL_CALL_RESULT':
      return mapSessionMessages(state, action.sessionId, (m) =>
        m.kind === 'tool-call' && m.toolCallId === action.toolCallId
          ? {
              ...m,
              output: action.output,
              status: action.isError ? 'error' : 'complete',
            }
          : m,
      );

    case 'TYPING_SET':
      return {
        ...state,
        typingBySession: { ...state.typingBySession, [action.sessionId]: action.active },
      };

    case 'TURN_STARTED':
      return {
        ...state,
        generatingBySession: { ...state.generatingBySession, [action.sessionId]: true },
      };

    case 'TURN_FINISHED':
      return {
        ...state,
        generatingBySession: { ...state.generatingBySession, [action.sessionId]: false },
        typingBySession: { ...state.typingBySession, [action.sessionId]: false },
      };

    case 'MESSAGES_TRUNCATED': {
      const messages = state.messagesBySession[action.sessionId];
      if (!messages) return state;
      const index = messages.findIndex((m) => m.id === action.fromMessageId);
      if (index === -1) return state;
      return {
        ...state,
        messagesBySession: {
          ...state.messagesBySession,
          [action.sessionId]: messages.slice(0, index),
        },
      };
    }
  }
}
