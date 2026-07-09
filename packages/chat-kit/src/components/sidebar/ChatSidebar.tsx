import { useCallback, useRef, useState } from 'react';
import { PanelLeftIcon, PlusIcon } from '../../icons';
import { useChatKitConfig } from '../../state/ChatKitProvider';
import { useSessions } from '../../state/useSessions';
import { cx } from '../internal/cx';
import { SessionItem } from './SessionItem';

export interface ChatSidebarProps {
  className?: string | undefined;
  defaultCollapsed?: boolean;
}

/** Below this container width the expanded sidebar overlays the chat (matches the @max-2xl utilities). */
const NARROW_CONTAINER_PX = 672;

/** Collapsible multi-session sidebar: new chat, switch, rename, delete. */
export function ChatSidebar({ className, defaultCollapsed = false }: ChatSidebarProps) {
  const { strings } = useChatKitConfig();
  const { sessions, activeSessionId, createSession, renameSession, deleteSession, switchSession } =
    useSessions();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const rootWidthRef = useRef<number>(Infinity);
  const measuredRef = useRef(false);

  // One-shot: in a narrow container (embedded panel, phone) start collapsed so
  // the overlay doesn't cover the conversation on first paint.
  const navRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    rootWidthRef.current = node.parentElement?.clientWidth ?? Infinity;
    if (!measuredRef.current && rootWidthRef.current < NARROW_CONTAINER_PX) {
      setCollapsed(true);
    }
    measuredRef.current = true;
  }, []);

  const selectSession = (sessionId: string) => {
    switchSession(sessionId);
    // Overlay mode: picking a session should reveal the conversation.
    if (rootWidthRef.current < NARROW_CONTAINER_PX) setCollapsed(true);
  };

  if (collapsed) {
    return (
      <nav
        ref={navRef}
        aria-label={strings.sessionListLabel}
        className={cx('flex flex-col items-center gap-1 border-r bg-surface p-2', className)}
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          aria-expanded="false"
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <PanelLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={createSession}
          aria-label={strings.newChat}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <PlusIcon className="size-4" />
        </button>
      </nav>
    );
  }

  return (
    <nav
      ref={navRef}
      aria-label={strings.sessionListLabel}
      className={cx(
        'flex w-64 shrink-0 flex-col border-r bg-surface',
        // In narrow containers (embedded panels, phones) the expanded sidebar
        // overlays the chat instead of squeezing it.
        '@max-2xl:absolute @max-2xl:inset-y-0 @max-2xl:left-0 @max-2xl:z-20 @max-2xl:shadow-xl',
        className,
      )}
    >
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          onClick={createSession}
          className="flex flex-1 items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-surface-hover"
        >
          <PlusIcon className="size-4" />
          {strings.newChat}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
          aria-expanded="true"
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <PanelLeftIcon className="size-4" />
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto p-2 pt-0">
        {sessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            active={session.id === activeSessionId}
            onSelect={() => selectSession(session.id)}
            onRename={(title) => renameSession(session.id, title)}
            onDelete={() => deleteSession(session.id)}
          />
        ))}
      </ul>
    </nav>
  );
}
