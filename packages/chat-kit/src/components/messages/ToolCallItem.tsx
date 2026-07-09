import { CheckIcon, LoaderIcon, WrenchIcon, XIcon } from '../../icons';
import type { ToolCallMessage } from '../../types';

/**
 * Compact tool-use row. Expanded collapsible input/output view lands in M6;
 * the distinct message kind is already wired end to end.
 */
export function ToolCallItem({ message }: { message: ToolCallMessage }) {
  return (
    <div className="ck-message-enter flex w-fit items-center gap-2 rounded-md border bg-surface px-3 py-1.5 text-sm text-muted-foreground">
      <WrenchIcon className="size-3.5" aria-hidden />
      <span className="font-mono">{message.toolName}</span>
      {message.status === 'running' && (
        <LoaderIcon className="size-3.5 animate-spin" aria-label="running" />
      )}
      {message.status === 'complete' && <CheckIcon className="size-3.5" aria-label="complete" />}
      {message.status === 'error' && <XIcon className="size-3.5 text-danger" aria-label="failed" />}
    </div>
  );
}
