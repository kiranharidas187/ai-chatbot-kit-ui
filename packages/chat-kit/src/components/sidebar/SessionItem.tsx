import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CheckIcon, PencilIcon, TrashIcon, XIcon } from '../../icons';
import { useChatKitConfig } from '../../state/ChatKitProvider';
import type { Session } from '../../types';
import { cx } from '../internal/cx';

export interface SessionItemProps {
  session: Session;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export function SessionItem({ session, active, onSelect, onRename, onDelete }: SessionItemProps) {
  const { strings } = useChatKitConfig();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draft, setDraft] = useState(session.title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitRename = () => {
    setEditing(false);
    if (draft.trim() && draft !== session.title) onRename(draft);
    else setDraft(session.title);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commitRename();
    if (event.key === 'Escape') {
      setDraft(session.title);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <li>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={onInputKeyDown}
          aria-label={strings.renameSession}
          className="w-full rounded-md border border-accent bg-background px-2.5 py-1.5 text-sm outline-none"
        />
      </li>
    );
  }

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className={cx(
          'w-full truncate rounded-md px-2.5 py-1.5 pr-14 text-left text-sm transition-colors',
          active ? 'bg-surface-hover font-medium' : 'hover:bg-surface-hover',
        )}
        title={session.title}
      >
        {session.title}
      </button>

      <span
        className={cx(
          'absolute inset-y-0 right-1 flex items-center gap-0.5',
          'opacity-0 focus-within:opacity-100 group-hover:opacity-100',
        )}
      >
        {confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`${strings.deleteSession}?`}
              className="grid size-6 place-items-center rounded-sm text-danger hover:bg-surface-hover"
            >
              <CheckIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              aria-label="Cancel"
              className="grid size-6 place-items-center rounded-sm hover:bg-surface-hover"
            >
              <XIcon className="size-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={strings.renameSession}
              className="grid size-6 place-items-center rounded-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <PencilIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label={strings.deleteSession}
              className="grid size-6 place-items-center rounded-sm text-muted-foreground hover:bg-surface-hover hover:text-danger"
            >
              <TrashIcon className="size-3.5" />
            </button>
          </>
        )}
      </span>
    </li>
  );
}
