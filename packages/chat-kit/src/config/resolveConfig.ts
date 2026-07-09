import { deepMerge } from './deepMerge';
import { defaultConfig } from './defaults';
import type { ChatKitConfig, ResolvedChatKitConfig } from './types';

export function resolveConfig(config: ChatKitConfig = {}): ResolvedChatKitConfig {
  return deepMerge(defaultConfig, config);
}
