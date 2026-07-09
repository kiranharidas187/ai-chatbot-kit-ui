export interface ChatWindowProps {
  /** Placeholder prop until the real component lands in M3. */
  title?: string;
}

/**
 * Placeholder scaffold component. Replaced by the real batteries-included
 * chat window in milestone 3; exists now so the demo app can verify the
 * build → import pipeline end to end.
 */
export function ChatWindow({ title = 'ChatKit' }: ChatWindowProps) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p>{title} scaffold is wired up — library build consumed by demo app.</p>
    </div>
  );
}
