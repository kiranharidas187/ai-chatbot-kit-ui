import { describe, expect, it } from 'vitest';
import { defaultTheme } from './defaultTheme';
import { resolveThemeVars } from './resolveThemeVars';

describe('resolveThemeVars', () => {
  it('maps the light palette to kebab-cased --ck-color-* vars', () => {
    const vars = resolveThemeVars(defaultTheme, 'light');
    expect(vars['--ck-color-background']).toBe('#ffffff');
    expect(vars['--ck-color-muted-foreground']).toBe(defaultTheme.light.mutedForeground);
    expect(vars['--ck-color-user-bubble-foreground']).toBe(
      defaultTheme.light.userBubbleForeground,
    );
  });

  it('uses the dark palette when the effective mode is dark', () => {
    const vars = resolveThemeVars(defaultTheme, 'dark');
    expect(vars['--ck-color-background']).toBe(defaultTheme.dark.background);
    expect(vars['--ck-color-accent']).toBe(defaultTheme.dark.accent);
  });

  it('emits typography, radius, and spacing tokens', () => {
    const vars = resolveThemeVars(defaultTheme, 'light');
    expect(vars['--ck-font-sans']).toBe(defaultTheme.typography.fontSans);
    expect(vars['--ck-font-mono']).toBe(defaultTheme.typography.fontMono);
    expect(vars['--ck-text-base']).toBe(defaultTheme.typography.baseSize);
    expect(vars['--ck-radius-bubble']).toBe(defaultTheme.radius.bubble);
    expect(vars['--ck-spacing-unit']).toBe(defaultTheme.spacing.unit);
  });
});
