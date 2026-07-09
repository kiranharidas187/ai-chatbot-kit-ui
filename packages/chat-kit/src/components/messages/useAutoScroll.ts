import { useEffect, useRef, type RefObject } from 'react';

const STICK_THRESHOLD_PX = 48;

/**
 * Keep the container pinned to the bottom while new content streams in, but
 * release the pin as soon as the user scrolls up to read history — and
 * re-engage it when they scroll back down.
 */
export function useAutoScroll(dep: unknown): {
  containerRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
} {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el && stickRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [dep]);

  return { containerRef, onScroll };
}
