import { describe, expect, it } from 'vitest';
import type { Session, TextMessage, ToolCallMessage } from '../types';
import { chatReducer, emptyChatState } from './chatReducer';
import type { ChatAction, ChatState } from './types';

const session = (id: string, title = 'New chat'): Session => ({
  id,
  title,
  createdAt: 1000,
  updatedAt: 1000,
});

const textMessage = (id: string, overrides: Partial<TextMessage> = {}): TextMessage => ({
  kind: 'text',
  id,
  role: 'user',
  content: 'hello',
  status: 'complete',
  createdAt: 2000,
  ...overrides,
});

const toolCall = (id: string, toolCallId: string): ToolCallMessage => ({
  kind: 'tool-call',
  id,
  role: 'assistant',
  toolCallId,
  toolName: 'search',
  status: 'running',
  createdAt: 2000,
});

function reduce(actions: ChatAction[], initial: ChatState = emptyChatState): ChatState {
  return actions.reduce(chatReducer, initial);
}

describe('chatReducer sessions', () => {
  it('creates a session, activates it, and initializes empty messages', () => {
    const state = reduce([{ type: 'SESSION_CREATED', session: session('s1') }]);
    expect(state.activeSessionId).toBe('s1');
    expect(state.messagesBySession['s1']).toEqual([]);
  });

  it('prepends new sessions (most recent first)', () => {
    const state = reduce([
      { type: 'SESSION_CREATED', session: session('s1') },
      { type: 'SESSION_CREATED', session: session('s2') },
    ]);
    expect(state.sessions.map((s) => s.id)).toEqual(['s2', 's1']);
    expect(state.activeSessionId).toBe('s2');
  });

  it('renames a session', () => {
    const state = reduce([
      { type: 'SESSION_CREATED', session: session('s1') },
      { type: 'SESSION_RENAMED', sessionId: 's1', title: 'Budget qs' },
    ]);
    expect(state.sessions[0]?.title).toBe('Budget qs');
  });

  it('deleting the active session activates the next one and drops its data', () => {
    const state = reduce([
      { type: 'SESSION_CREATED', session: session('s1') },
      { type: 'SESSION_CREATED', session: session('s2') },
      { type: 'MESSAGE_ADDED', sessionId: 's2', message: textMessage('m1') },
      { type: 'SESSION_DELETED', sessionId: 's2' },
    ]);
    expect(state.activeSessionId).toBe('s1');
    expect(state.sessions).toHaveLength(1);
    expect(state.messagesBySession['s2']).toBeUndefined();
  });

  it('deleting the last session leaves no active session', () => {
    const state = reduce([
      { type: 'SESSION_CREATED', session: session('s1') },
      { type: 'SESSION_DELETED', sessionId: 's1' },
    ]);
    expect(state.activeSessionId).toBeNull();
    expect(state.sessions).toHaveLength(0);
  });
});

describe('chatReducer messages', () => {
  const base = reduce([{ type: 'SESSION_CREATED', session: session('s1') }]);

  it('adding a message bumps the session updatedAt', () => {
    const state = reduce([{ type: 'MESSAGE_ADDED', sessionId: 's1', message: textMessage('m1') }], base);
    expect(state.messagesBySession['s1']).toHaveLength(1);
    expect(state.sessions[0]?.updatedAt).toBe(2000);
  });

  it('accumulates text deltas and keeps status streaming', () => {
    const state = reduce(
      [
        {
          type: 'MESSAGE_ADDED',
          sessionId: 's1',
          message: textMessage('a1', { role: 'assistant', content: '', status: 'streaming' }),
        },
        { type: 'TEXT_DELTA', sessionId: 's1', messageId: 'a1', delta: 'Hel' },
        { type: 'TEXT_DELTA', sessionId: 's1', messageId: 'a1', delta: 'lo' },
      ],
      base,
    );
    const message = state.messagesBySession['s1']?.[0] as TextMessage;
    expect(message.content).toBe('Hello');
    expect(message.status).toBe('streaming');
  });

  it('accumulates thinking deltas separately from content', () => {
    const state = reduce(
      [
        {
          type: 'MESSAGE_ADDED',
          sessionId: 's1',
          message: textMessage('a1', { role: 'assistant', content: '', status: 'streaming' }),
        },
        { type: 'THINKING_DELTA', sessionId: 's1', messageId: 'a1', delta: 'hmm ' },
        { type: 'THINKING_DELTA', sessionId: 's1', messageId: 'a1', delta: 'ok' },
      ],
      base,
    );
    const message = state.messagesBySession['s1']?.[0] as TextMessage;
    expect(message.thinking).toBe('hmm ok');
    expect(message.content).toBe('');
  });

  it('sets error status with error details, and clears error on retry status', () => {
    const withError = reduce(
      [
        { type: 'MESSAGE_ADDED', sessionId: 's1', message: textMessage('a1', { role: 'assistant' }) },
        {
          type: 'MESSAGE_STATUS',
          sessionId: 's1',
          messageId: 'a1',
          status: 'error',
          error: { message: 'boom', retryable: true },
        },
      ],
      base,
    );
    const errored = withError.messagesBySession['s1']?.[0] as TextMessage;
    expect(errored.status).toBe('error');
    expect(errored.error?.message).toBe('boom');

    const cleared = chatReducer(withError, {
      type: 'MESSAGE_STATUS',
      sessionId: 's1',
      messageId: 'a1',
      status: 'complete',
    });
    const message = cleared.messagesBySession['s1']?.[0] as TextMessage;
    expect(message.status).toBe('complete');
    expect(message.error).toBeUndefined();
  });

  it('resolves tool calls by toolCallId', () => {
    const state = reduce(
      [
        { type: 'MESSAGE_ADDED', sessionId: 's1', message: toolCall('t1', 'call-1') },
        { type: 'TOOL_CALL_RESULT', sessionId: 's1', toolCallId: 'call-1', output: { hits: 3 } },
      ],
      base,
    );
    const message = state.messagesBySession['s1']?.[0] as ToolCallMessage;
    expect(message.status).toBe('complete');
    expect(message.output).toEqual({ hits: 3 });
  });

  it('truncates from a message id (retry/regenerate)', () => {
    const state = reduce(
      [
        { type: 'MESSAGE_ADDED', sessionId: 's1', message: textMessage('m1') },
        { type: 'MESSAGE_ADDED', sessionId: 's1', message: textMessage('a1', { role: 'assistant' }) },
        { type: 'MESSAGE_ADDED', sessionId: 's1', message: textMessage('m2') },
        { type: 'MESSAGES_TRUNCATED', sessionId: 's1', fromMessageId: 'a1' },
      ],
      base,
    );
    expect(state.messagesBySession['s1']?.map((m) => m.id)).toEqual(['m1']);
  });

  it('turn lifecycle toggles generating and clears typing on finish', () => {
    const started = reduce(
      [
        { type: 'TURN_STARTED', sessionId: 's1' },
        { type: 'TYPING_SET', sessionId: 's1', active: true },
      ],
      base,
    );
    expect(started.generatingBySession['s1']).toBe(true);
    expect(started.typingBySession['s1']).toBe(true);

    const finished = chatReducer(started, { type: 'TURN_FINISHED', sessionId: 's1' });
    expect(finished.generatingBySession['s1']).toBe(false);
    expect(finished.typingBySession['s1']).toBe(false);
  });
});
