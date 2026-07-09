import { useChatKitConfig } from '../state/ChatKitProvider';
import { ChatComposer } from './composer/ChatComposer';
import { ChatKitRoot } from './internal/ChatKitRoot';
import { cx } from './internal/cx';
import { ChatMessages } from './messages/ChatMessages';
import { ChatSidebar } from './sidebar/ChatSidebar';

export interface ChatWindowProps {
  /** Extra classes on the root element, e.g. sizing when embedding in a panel. */
  className?: string | undefined;
  /** Hide the built-in header when the host app provides its own chrome. */
  showHeader?: boolean;
  /** Hide the multi-session sidebar (e.g. single-conversation widgets). */
  showSidebar?: boolean;
  /** Start with the sidebar collapsed. */
  sidebarDefaultCollapsed?: boolean;
}

/**
 * Batteries-included chat window: session sidebar, header, message history,
 * composer. Compose the exported parts directly (`ChatSidebar`,
 * `ChatMessages`, `ChatComposer`) for custom layouts.
 */
export function ChatWindow({
  className,
  showHeader = true,
  showSidebar = true,
  sidebarDefaultCollapsed = false,
}: ChatWindowProps) {
  const { branding } = useChatKitConfig();

  return (
    <ChatKitRoot className={cx('flex h-full w-full', className)}>
      {showSidebar && <ChatSidebar defaultCollapsed={sidebarDefaultCollapsed} />}
      <div className="flex min-w-0 flex-1 flex-col">
        {showHeader && (
        <header className="flex items-center gap-3 border-b px-4 py-3">
          {branding.avatarUrl ? (
            <img src={branding.avatarUrl} alt="" className="size-8 rounded-full" />
          ) : (
            <div
              aria-hidden
              className="grid size-8 place-items-center rounded-full bg-accent font-semibold text-accent-foreground"
            >
              {branding.botName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold">{branding.botName}</span>
        </header>
        )}

        <ChatMessages />

        <footer className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
          <ChatComposer />
        </footer>
      </div>
    </ChatKitRoot>
  );
}
