import { describe, expect, it } from 'vitest';
import type { PersistenceAdapter } from '../persistence/types';
import { deepMerge } from './deepMerge';
import { defaultConfig } from './defaults';
import { resolveConfig } from './resolveConfig';

describe('resolveConfig', () => {
  it('returns defaults for an empty config', () => {
    const resolved = resolveConfig();
    expect(resolved).toEqual(defaultConfig);
  });

  it('does not mutate the defaults', () => {
    resolveConfig({ branding: { botName: 'X' } });
    expect(defaultConfig.branding.botName).toBe('Assistant');
  });

  it('deep-merges nested objects, keeping sibling defaults', () => {
    const resolved = resolveConfig({
      features: { messageActions: { copy: false } },
    });
    expect(resolved.features.messageActions.copy).toBe(false);
    expect(resolved.features.messageActions.regenerate).toBe(true);
    expect(resolved.features.mic).toBe(true);
  });

  it('merges partial theme palettes into the default theme', () => {
    const resolved = resolveConfig({
      theme: { light: { accent: '#ff0000' } },
    });
    expect(resolved.theme.light.accent).toBe('#ff0000');
    expect(resolved.theme.light.background).toBe('#ffffff');
    expect(resolved.theme.dark.accent).toBe(defaultConfig.theme.dark.accent);
  });

  it('ignores explicitly-undefined values (untyped JS consumers)', () => {
    // exactOptionalPropertyTypes forbids this in TS; JS consumers can still do it.
    const config = { branding: { botName: undefined } } as unknown as Parameters<
      typeof resolveConfig
    >[0];
    const resolved = resolveConfig(config);
    expect(resolved.branding.botName).toBe('Assistant');
  });

  it('replaces adapter objects wholesale instead of merging into them', () => {
    const adapter: PersistenceAdapter = {
      loadSessions: async () => [],
      saveSession: async () => {},
      deleteSession: async () => {},
      loadMessages: async () => [],
      saveMessages: async () => {},
    };
    const resolved = resolveConfig({ sessions: { persistence: adapter } });
    expect(resolved.sessions.persistence).toBe(adapter);
    expect(resolved.sessions.maxSessions).toBe(50);
  });

  it('overrides individual strings while keeping the rest', () => {
    const resolved = resolveConfig({ strings: { newChat: 'Nouvelle conversation' } });
    expect(resolved.strings.newChat).toBe('Nouvelle conversation');
    expect(resolved.strings.retry).toBe('Retry');
  });
});

describe('deepMerge', () => {
  it('replaces arrays instead of concatenating', () => {
    const merged = deepMerge({ a: [1, 2, 3] }, { a: [4] });
    expect(merged.a).toEqual([4]);
  });

  it('returns base when override is not a plain object', () => {
    const base = { a: 1 };
    expect(deepMerge(base, undefined)).toBe(base);
    expect(deepMerge(base, null)).toBe(base);
  });
});
