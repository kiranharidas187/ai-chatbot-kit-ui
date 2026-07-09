import { useEffect, useState } from 'react';
import type { ThemeMode } from './types';

const QUERY = '(prefers-color-scheme: dark)';

function systemMode(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia(QUERY).matches ? 'dark' : 'light';
}

/** Collapse 'system' to the OS preference and track changes to it live. */
export function useEffectiveMode(mode: ThemeMode): 'light' | 'dark' {
  const [system, setSystem] = useState(systemMode);

  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined') return;
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(QUERY);
    const onChange = () => setSystem(mql.matches ? 'dark' : 'light');
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [mode]);

  return mode === 'system' ? system : mode;
}
