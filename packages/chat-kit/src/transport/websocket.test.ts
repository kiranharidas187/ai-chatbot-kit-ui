import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatEvent, OutgoingMessage, TransportContext } from './types';
import { createWebSocketTransport } from './websocket';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }

  // test drivers
  open(): void {
    this.readyState = 1;
    this.onopen?.();
  }

  receive(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  fail(): void {
    this.onerror?.();
    this.close();
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const message: OutgoingMessage = { sessionId: 's1', content: 'hi', history: [] };
const ctx = (signal = new AbortController().signal): TransportContext => ({
  sessionId: 's1',
  signal,
  headers: {},
});

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function collectTurn(transport: ReturnType<typeof createWebSocketTransport>, context = ctx()) {
  const events: ChatEvent[] = [];
  const finished = (async () => {
    for await (const event of transport.sendMessage(message, context)) events.push(event);
  })();
  return { events, finished };
}

describe('createWebSocketTransport', () => {
  it('connects lazily, sends the message, and yields events until done', async () => {
    const transport = createWebSocketTransport({ url: 'ws://x' });
    const { events, finished } = collectTurn(transport);

    await tick();
    const ws = FakeWebSocket.instances[0]!;
    ws.open();
    await tick();

    expect(JSON.parse(ws.sent[0]!)).toMatchObject({ type: 'message', sessionId: 's1', message: 'hi' });

    ws.receive({ sessionId: 's1', type: 'typing', active: true });
    ws.receive({ sessionId: 's1', type: 'text-delta', delta: 'He' });
    ws.receive({ sessionId: 's1', type: 'text-delta', delta: 'y' });
    ws.receive({ sessionId: 's1', type: 'done' });
    await finished;

    expect(events).toEqual([
      { type: 'typing', active: true },
      { type: 'text-delta', delta: 'He' },
      { type: 'text-delta', delta: 'y' },
      { type: 'done' },
    ]);
  });

  it('routes unsolicited events to onServerEvent subscribers when no turn is active', async () => {
    const transport = createWebSocketTransport({ url: 'ws://x' });
    const seen: Array<{ sessionId: string; event: ChatEvent }> = [];
    transport.onServerEvent?.((sessionId, event) => seen.push({ sessionId, event }));

    const pending = transport.connect?.('s1');
    await tick();
    const ws = FakeWebSocket.instances[0]!;
    ws.open();
    await pending;

    ws.receive({ sessionId: 's1', type: 'typing', active: true });
    expect(seen).toEqual([{ sessionId: 's1', event: { type: 'typing', active: true } }]);
  });

  it('emits a retryable error when the socket drops mid-turn', async () => {
    const transport = createWebSocketTransport({ url: 'ws://x' });
    const { events, finished } = collectTurn(transport);

    await tick();
    const ws = FakeWebSocket.instances[0]!;
    ws.open();
    await tick();

    ws.receive({ sessionId: 's1', type: 'text-delta', delta: 'part' });
    ws.close();
    await finished;

    expect(events).toEqual([
      { type: 'text-delta', delta: 'part' },
      { type: 'error', message: 'Connection lost', retryable: true },
    ]);
  });

  it('retries the initial connection with backoff before giving up', async () => {
    const transport = createWebSocketTransport({
      url: 'ws://x',
      reconnect: { maxAttempts: 2, initialDelayMs: 1, maxDelayMs: 2 },
    });
    const { events, finished } = collectTurn(transport);

    await tick();
    FakeWebSocket.instances[0]!.fail();
    await vi.waitFor(() => expect(FakeWebSocket.instances.length).toBe(2));
    FakeWebSocket.instances[1]!.open();
    await tick();

    const ws = FakeWebSocket.instances[1]!;
    expect(ws.sent).toHaveLength(1);
    ws.receive({ sessionId: 's1', type: 'done' });
    await finished;
    expect(events).toEqual([{ type: 'done' }]);
  });

  it('gives up connecting after maxAttempts', async () => {
    const transport = createWebSocketTransport({
      url: 'ws://x',
      reconnect: { maxAttempts: 2, initialDelayMs: 1, maxDelayMs: 2 },
    });
    const { events, finished } = collectTurn(transport);

    await tick();
    FakeWebSocket.instances[0]!.fail();
    await vi.waitFor(() => expect(FakeWebSocket.instances.length).toBe(2));
    FakeWebSocket.instances[1]!.fail();
    await finished;

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'error', retryable: true });
  });

  it('stops yielding when aborted', async () => {
    const controller = new AbortController();
    const transport = createWebSocketTransport({ url: 'ws://x' });
    const { events, finished } = collectTurn(transport, ctx(controller.signal));

    await tick();
    const ws = FakeWebSocket.instances[0]!;
    ws.open();
    await tick();

    ws.receive({ sessionId: 's1', type: 'text-delta', delta: 'a' });
    await tick();
    controller.abort();
    await finished;

    expect(events).toEqual([{ type: 'text-delta', delta: 'a' }]);
  });
});
