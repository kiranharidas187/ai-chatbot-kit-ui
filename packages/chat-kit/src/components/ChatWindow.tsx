import { SendIcon } from '../icons';
import { useChatKitConfig } from '../state/ChatKitProvider';
import { ChatKitRoot } from './internal/ChatKitRoot';
import { cx } from './internal/cx';

export interface ChatWindowProps {
  /** Extra classes on the root element, e.g. sizing when embedding in a panel. */
  className?: string | undefined;
}

/**
 * Batteries-included chat window. M2 state: themed static shell proving the
 * token pipeline; message list, live composer, and sidebar land in M3/M5.
 */
export function ChatWindow({ className }: ChatWindowProps) {
  const { branding } = useChatKitConfig();

  return (
    <ChatKitRoot className={cx('flex h-full w-full flex-col', className)}>
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

      <main className="grid flex-1 place-items-center overflow-y-auto px-4">
        <p className="max-w-md text-center text-muted-foreground">{branding.welcomeMessage}</p>
      </main>

      <footer className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 rounded-lg border bg-surface px-3 py-2">
          <input
            disabled
            placeholder={branding.inputPlaceholder}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            disabled
            aria-label="Send"
            className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground opacity-50"
          >
            <SendIcon className="size-4" />
          </button>
        </div>
      </footer>
    </ChatKitRoot>
  );
}
