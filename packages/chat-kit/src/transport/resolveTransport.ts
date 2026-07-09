import { createEchoTransport } from './echo';
import type { TransportAdapter, TransportConfig } from './types';

let warnedNoTransport = false;

/** Turn the config's transport section into a live adapter instance. */
export function resolveTransport(config: TransportConfig | undefined): TransportAdapter {
  if (!config) {
    if (!warnedNoTransport && typeof console !== 'undefined') {
      warnedNoTransport = true;
      console.warn(
        '[chat-kit] No transport configured — falling back to the demo echo transport. ' +
          'Set `transport` in your ChatKit config to talk to a real backend.',
      );
    }
    return createEchoTransport();
  }
  switch (config.mode) {
    case 'custom':
      return config.adapter;
    case 'sse':
    case 'websocket':
    case 'http':
      // Built-in network transports land in M4.
      throw new Error(`[chat-kit] Transport mode '${config.mode}' is not implemented yet.`);
  }
}
