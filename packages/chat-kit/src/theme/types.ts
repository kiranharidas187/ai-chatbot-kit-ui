export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  foreground: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  userBubble: string;
  userBubbleForeground: string;
  assistantBubble: string;
  assistantBubbleForeground: string;
  danger: string;
  dangerForeground: string;
}

export interface ThemeTypography {
  fontSans: string;
  fontMono: string;
  /** Base font size of the chat UI, e.g. '0.9375rem'. */
  baseSize: string;
}

export interface ThemeRadius {
  sm: string;
  md: string;
  lg: string;
  bubble: string;
}

export interface ThemeSpacing {
  /** Base spacing unit all component spacing scales from, e.g. '0.25rem'. */
  unit: string;
}

/** Fully-resolved theme, after defaults are applied. */
export interface ResolvedTheme {
  mode: ThemeMode;
  light: ThemeColors;
  dark: ThemeColors;
  typography: ThemeTypography;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
}

/** Consumer-facing theme config: everything optional, deep-merged over the default theme. */
export interface ChatTheme {
  mode?: ThemeMode;
  light?: Partial<ThemeColors>;
  dark?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  radius?: Partial<ThemeRadius>;
  spacing?: Partial<ThemeSpacing>;
}
