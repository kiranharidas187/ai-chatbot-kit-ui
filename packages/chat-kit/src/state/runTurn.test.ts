import { describe, expect, it } from 'vitest';
import type { ChatEvent, TransportAdapter } from '../transport/types';
import type { TextMessage, ToolCallMessage } from '../types';
import { chatReducer, emptyChatState } from './chatReducer';
import { runTurn } from './runTurn';
import type { ChatState } from './types';

/** Fold dispatched actions through the real reducer so tests assert final state. */
function makeHarness() {
  let state: ChatState = chatReducer(emptyChatState, {
    type: 'SESSION_CREATED',
    session: { id: 's1', title: 'New chat', createdAt: 1, updatedAt: 1 },
  });
  return {
    dispatch: (action: Parameters<typeof chatReducer>[1]) => {
      state = chatReducer(state, action);
    },
    messages: () => state.messagesBySession['s1'] ?? [],
    state: () => state,
  };
}

function scriptedTransport(events: ChatEvent[]): TransportAdapter {
  return {
    async *sendMessage() {
      yield* events;
    },
  };
}

async function run(transport: TransportAdapter, harness = makeHarness(), signal?: AbortSignal) {
  await runTurn({
    transport,
    dispatch: harness.dispatch,
    sessionId: 's1',
    content: 'hi',
    history: [],
    headers: {},
    signal: signal ?? new AbortController().signal,
    errorFallbackText: 'Something went wrong.',
  });
  return harness;
}

describe('runTurn', () => {
  it('folds text deltas into one completed assistant message', async () => {
    const harness = await run(
      scriptedTransport([
        { type: 'text-delta', delta: 'Hel' },
        { type: 'text-delta', delta: 'lo' },
        { type: 'done' },
      ]),
    );
    const messages = harness.messages() as TextMessage[];
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe('Hello');
    expect(messages[0]?.status).toBe('complete');
    expect(harness.state().generatingBySession['s1']).toBe(false);
  });

  it('handles a non-streaming full text event', async () => {
    const harness = await run(scriptedTransport([{ type: 'text', content: 'Full answer' }]));
    const messages = harness.messages() as TextMessage[];
    expect(messages[0]?.content).toBe('Full answer');
    expect(messages[0]?.status).toBe('complete');
  });

  it('splits interleaved agentic output: text, tool call, more text', async () => {
    const harness = await run(
      scriptedTransport([
        { type: 'text-delta', delta: 'Let me check.' },
        { type: 'tool-call-start', toolCallId: 'c1', toolName: 'search', input: { q: 'x' } },
        { type: 'tool-call-result', toolCallId: 'c1', output: { hits: 2 } },
        { type: 'text-delta', delta: 'Found it.' },
        { type: 'done' },
      ]),
    );
    const messages = harness.messages();
    expect(messages.map((m) => m.kind)).toEqual(['text', 'tool-call', 'text']);
    expect((messages[0] as TextMessage).status).toBe('complete');
    const tool = messages[1] as ToolCallMessage;
    expect(tool.toolName).toBe('search');
    expect(tool.status).toBe('complete');
    expect(tool.output).toEqual({ hits: 2 });
    expect((messages[2] as TextMessage).content).toBe('Found it.');
  });

  it('accumulates thinking deltas on the assistant message', async () => {
    const harness = await run(
      scriptedTransport([
        { type: 'thinking-delta', delta: 'pondering…' },
        { type: 'text-delta', delta: 'Answer' },
        { type: 'done' },
      ]),
    );
    const message = harness.messages()[0] as TextMessage;
    expect(message.thinking).toBe('pondering…');
    expect(message.content).toBe('Answer');
  });

  it('marks an error event as a retryable errored message', async () => {
    const harness = await run(
      scriptedTransport([{ type: 'error', message: 'rate limited', retryable: true }]),
    );
    const message = harness.messages()[0] as TextMessage;
    expect(message.status).toBe('error');
    expect(message.error).toEqual({ message: 'rate limited', retryable: true });
  });

  it('turns a thrown transport error into an errored message and still finishes the turn', async () => {
    const transport: TransportAdapter = {
       
      async *sendMessage() {
        yield { type: 'text-delta', delta: 'partial' } as ChatEvent;
        throw new Error('connection reset');
      },
    };
    const harness = await run(transport);
    const message = harness.messages()[0] as TextMessage;
    expect(message.status).toBe('error');
    expect(message.error?.message).toBe('connection reset');
    expect(harness.state().generatingBySession['s1']).toBe(false);
  });

  it('keeps partial content as the final answer when aborted', async () => {
    const controller = new AbortController();
    const transport: TransportAdapter = {
      async *sendMessage(_message, ctx) {
        yield { type: 'text-delta', delta: 'partial ' } as ChatEvent;
        controller.abort();
        // Simulate an adapter that notices the abort mid-stream.
        if (ctx.signal.aborted) throw new DOMException('Aborted', 'AbortError');
      },
    };
    const harness = await run(transport, makeHarness(), controller.signal);
    const message = harness.messages()[0] as TextMessage;
    expect(message.content).toBe('partial ');
    expect(message.status).toBe('complete');
  });

  it('forwards typing events', async () => {
    const events: ChatEvent[] = [{ type: 'typing', active: true }];
    let sawTyping = false;
    const harness = makeHarness();
    const originalDispatch = harness.dispatch;
    const spyingHarness = {
      ...harness,
      dispatch: (action: Parameters<typeof originalDispatch>[0]) => {
        if (action.type === 'TYPING_SET' && action.active) sawTyping = true;
        originalDispatch(action);
      },
    };
    await run(scriptedTransport(events), spyingHarness);
    expect(sawTyping).toBe(true);
  });

  it('produces no assistant message for an empty event stream', async () => {
    const harness = await run(scriptedTransport([{ type: 'done' }]));
    expect(harness.messages()).toHaveLength(0);
  });
});
