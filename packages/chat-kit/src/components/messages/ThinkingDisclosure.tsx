import { useState } from 'react';
import { ChevronRightIcon } from '../../icons';
import { cx } from '../internal/cx';

export interface ThinkingDisclosureProps {
  thinking: string;
  /** Actively receiving thinking deltas (no answer text yet). */
  active: boolean;
}

/** Collapsible "agent reasoning" block shown above the assistant's answer. */
export function ThinkingDisclosure({ thinking, active }: ThinkingDisclosureProps) {
  const [open, setOpen] = useState(false);
  const expanded = open || active;

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={expanded}
        className={cx(
          'flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground',
          active && 'ck-thinking-active',
        )}
      >
        <ChevronRightIcon
          className={cx('size-3.5 transition-transform', expanded && 'rotate-90')}
        />
        {active ? 'Thinking…' : 'Thought process'}
      </button>
      {expanded && (
        <div className="mt-1.5 whitespace-pre-wrap border-l-2 pl-3 text-sm italic text-muted-foreground">
          {thinking}
        </div>
      )}
    </div>
  );
}
