import { useState } from 'react';
import { CheckIcon, ChevronRightIcon, LoaderIcon, WrenchIcon, XIcon } from '../../icons';
import type { ToolCallMessage } from '../../types';
import { cx } from '../internal/cx';

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function StatusIcon({ status }: { status: ToolCallMessage['status'] }) {
  if (status === 'running') return <LoaderIcon className="size-3.5 animate-spin" aria-label="running" />;
  if (status === 'error') return <XIcon className="size-3.5 text-danger" aria-label="failed" />;
  return <CheckIcon className="size-3.5" aria-label="complete" />;
}

/**
 * Agent tool use as a distinct, collapsible message: header shows tool name +
 * live status; expanding reveals the input and output payloads.
 */
export function ToolCallItem({ message }: { message: ToolCallMessage }) {
  const [open, setOpen] = useState(false);
  const hasDetails = message.input !== undefined || message.output !== undefined;

  return (
    <div className="ck-message-enter w-fit max-w-full overflow-hidden rounded-md border bg-surface text-sm">
      <button
        type="button"
        onClick={() => hasDetails && setOpen(!open)}
        aria-expanded={hasDetails ? open : undefined}
        className={cx(
          'flex w-full items-center gap-2 px-3 py-1.5 text-muted-foreground',
          hasDetails && 'hover:bg-surface-hover',
        )}
      >
        {hasDetails && (
          <ChevronRightIcon
            className={cx('size-3.5 shrink-0 transition-transform', open && 'rotate-90')}
          />
        )}
        <WrenchIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="font-mono">{message.toolName}</span>
        <StatusIcon status={message.status} />
      </button>

      {open && hasDetails && (
        <div className="space-y-2 border-t px-3 py-2">
          {message.input !== undefined && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Input
              </div>
              <pre className="overflow-x-auto rounded-sm bg-background p-2 font-mono text-xs">
                {formatValue(message.input)}
              </pre>
            </div>
          )}
          {message.output !== undefined && (
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Output
              </div>
              <pre className="overflow-x-auto rounded-sm bg-background p-2 font-mono text-xs">
                {formatValue(message.output)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
