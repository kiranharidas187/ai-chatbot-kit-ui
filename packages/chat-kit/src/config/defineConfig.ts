import type { ChatKitConfig } from './types';

/** Identity helper that gives consumers config type-checking and completion. */
export function defineConfig(config: ChatKitConfig): ChatKitConfig {
  return config;
}
