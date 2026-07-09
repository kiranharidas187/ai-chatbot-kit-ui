import type { ResolvedTheme } from './types';

export const defaultTheme: ResolvedTheme = {
  mode: 'system',
  light: {
    background: '#ffffff',
    surface: '#f4f4f5',
    surfaceHover: '#e9e9eb',
    border: '#e4e4e7',
    foreground: '#18181b',
    mutedForeground: '#71717a',
    accent: '#4f46e5',
    accentForeground: '#ffffff',
    userBubble: '#f4f4f5',
    userBubbleForeground: '#18181b',
    assistantBubble: 'transparent',
    assistantBubbleForeground: '#18181b',
    danger: '#dc2626',
    dangerForeground: '#ffffff',
  },
  dark: {
    background: '#1b1b1f',
    surface: '#26262b',
    surfaceHover: '#303036',
    border: '#2e2e35',
    foreground: '#f4f4f5',
    mutedForeground: '#a1a1aa',
    accent: '#6366f1',
    accentForeground: '#ffffff',
    userBubble: '#26262b',
    userBubbleForeground: '#f4f4f5',
    assistantBubble: 'transparent',
    assistantBubbleForeground: '#f4f4f5',
    danger: '#f87171',
    dangerForeground: '#1b1b1f',
  },
  typography: {
    fontSans:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    baseSize: '0.9375rem',
  },
  radius: {
    sm: '0.375rem',
    md: '0.625rem',
    lg: '1rem',
    bubble: '1.125rem',
  },
  spacing: {
    unit: '0.25rem',
  },
};
