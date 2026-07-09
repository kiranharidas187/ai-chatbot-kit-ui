import { createEchoTransport } from './echo';
import { createHttpTransport } from './http';
import { createSSETransport } from './sse';
import type { TransportAdapter, TransportConfig } from './types';
import { createWebSocketTransport } from './websocket';

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
      return createSSETransport({
        url: config.url,
        ...(config.headers ? { headers: config.headers } : {}),
        ...(config.withCredentials !== undefined
          ? { withCredentials: config.withCredentials }
          : {}),
        ...(config.retry ? { retry: config.retry } : {}),
      });
    case 'websocket':
      return createWebSocketTransport({
        url: config.url,
        ...(config.protocols ? { protocols: config.protocols } : {}),
        ...(config.reconnect ? { reconnect: config.reconnect } : {}),
      });
    case 'http':
      return createHttpTransport({
        url: config.url,
        ...(config.headers ? { headers: config.headers } : {}),
      });
  }
}
