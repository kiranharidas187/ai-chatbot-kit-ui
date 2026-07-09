import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useChatKitConfig } from '../../state/ChatKitProvider';
import { resolveThemeVars } from '../../theme/resolveThemeVars';
import { useEffectiveMode } from '../../theme/useEffectiveMode';
import { cx } from './cx';

export interface ChatKitRootProps {
  children: ReactNode;
  className?: string | undefined;
}

/**
 * Scopes all theme tokens: sets the `--ck-*` custom properties inline and the
 * effective color mode as a data attribute. Tokens are scoped here rather than
 * on :root so multiple differently-themed instances can coexist on one page.
 */
export function ChatKitRoot({ children, className }: ChatKitRootProps) {
  const config = useChatKitConfig();
  const mode = useEffectiveMode(config.theme.mode);
  const style = useMemo(
    () => resolveThemeVars(config.theme, mode) as CSSProperties,
    [config.theme, mode],
  );
  return (
    <div className={cx('ck-root', className)} style={style} data-ck-mode={mode}>
      {children}
    </div>
  );
}
