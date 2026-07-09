import { sleep } from '../utils/sleep';
import type { ChatEvent, TransportAdapter } from './types';

export interface EchoTransportOptions {
  /** Delay between streamed words. */
  delayMs?: number;
  /** Initial "thinking" delay before the reply starts. */
  initialDelayMs?: number;
}

/**
 * Backend-free transport that streams the user's message back word by word.
 * Used as the fallback when no transport is configured — handy for demos,
 * prototyping, and tests.
 */
export function createEchoTransport(options: EchoTransportOptions = {}): TransportAdapter {
  const delayMs = options.delayMs ?? 40;
  const initialDelayMs = options.initialDelayMs ?? 400;

  return {
    async *sendMessage(message, ctx): AsyncGenerator<ChatEvent> {
      yield { type: 'typing', active: true };
      await sleep(initialDelayMs, ctx.signal);
      yield { type: 'typing', active: false };

      const reply = `You said: “${message.content}”`;
      const words = reply.split(' ');
      for (let i = 0; i < words.length; i++) {
        await sleep(delayMs, ctx.signal);
        yield { type: 'text-delta', delta: (i > 0 ? ' ' : '') + words[i] };
      }
      yield { type: 'done' };
    },
  };
}
