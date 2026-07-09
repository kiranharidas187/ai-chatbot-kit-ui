import type { ResolvedTheme, ThemeColors } from './types';

const toKebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Resolve a theme to the `--ck-*` CSS custom properties applied inline on the
 * ChatKit root element. Runtime theme/mode switching is just re-rendering with
 * different values — no CSS rebuild involved.
 */
export function resolveThemeVars(
  theme: ResolvedTheme,
  effectiveMode: 'light' | 'dark',
): Record<string, string> {
  const palette: ThemeColors = theme[effectiveMode];
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(palette)) {
    vars[`--ck-color-${toKebab(key)}`] = value;
  }
  vars['--ck-font-sans'] = theme.typography.fontSans;
  vars['--ck-font-mono'] = theme.typography.fontMono;
  vars['--ck-text-base'] = theme.typography.baseSize;
  for (const [key, value] of Object.entries(theme.radius)) {
    vars[`--ck-radius-${key}`] = value;
  }
  vars['--ck-spacing-unit'] = theme.spacing.unit;
  return vars;
}
