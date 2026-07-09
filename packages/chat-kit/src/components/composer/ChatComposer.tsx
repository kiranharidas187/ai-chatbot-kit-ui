import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { MicIcon, PaperclipIcon, SendIcon, StopIcon, XIcon } from '../../icons';
import { webSpeechAdapter } from '../../speech/webSpeech';
import { useChatKitConfig, useChatKitStore } from '../../state/ChatKitProvider';
import { useChat } from '../../state/useChat';
import type { Attachment } from '../../types';
import { newId } from '../../utils/newId';
import { cx } from '../internal/cx';

export interface ChatComposerProps {
  className?: string | undefined;
  /** Focus the input on mount and whenever the active session changes. Default true. */
  autoFocus?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Message input: auto-growing textarea, Enter to send (Shift+Enter for a new
 * line), Escape stops generation, optional mic + attachments per feature flags.
 */
export function ChatComposer({ className, autoFocus = true }: ChatComposerProps) {
  const { branding, strings, features, speech } = useChatKitConfig();
  const { state } = useChatKitStore();
  const { sendMessage, stopGenerating, isGenerating } = useChat();
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Text present when recording started; the live transcript appends to it.
  const voiceBaseRef = useRef('');

  const speechAdapter = useMemo(() => speech.adapter ?? webSpeechAdapter(), [speech.adapter]);
  const micSupported = features.mic && speechAdapter.isSupported();

  useEffect(() => () => speechAdapter.stop(), [speechAdapter]);

  // Keep typing flowing across session switches.
  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus, state.activeSessionId]);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, []);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || isGenerating) return;
    sendMessage(trimmed, attachments.length > 0 ? { attachments } : undefined);
    setValue('');
    setAttachments([]);
    requestAnimationFrame(resize);
  }, [value, attachments, isGenerating, sendMessage, resize]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
    if (event.key === 'Escape' && isGenerating) {
      event.preventDefault();
      stopGenerating();
    }
  };

  const onFilesPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const picked: Attachment[] = [...files].map((file) => ({
        id: newId(),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        data: file,
      }));
      setAttachments((current) => [...current, ...picked]);
    }
    event.target.value = ''; // allow re-picking the same file
  };

  const toggleRecording = useCallback(() => {
    if (recording) {
      speechAdapter.stop();
      return; // onEnd flips the state
    }
    voiceBaseRef.current = value ? `${value.trimEnd()} ` : '';
    setRecording(true);
    speechAdapter.start({
      lang: speech.lang,
      onResult: ({ transcript }) => {
        setValue(voiceBaseRef.current + transcript);
        requestAnimationFrame(resize);
      },
      onError: () => setRecording(false),
      onEnd: () => setRecording(false),
    });
  }, [recording, speechAdapter, speech.lang, value, resize]);

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isGenerating;

  return (
    <div
      className={cx(
        'rounded-lg border bg-surface px-3 py-2 focus-within:border-accent',
        className,
      )}
    >
      {attachments.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs"
            >
              <PaperclipIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              <span className="max-w-40 truncate">{attachment.name}</span>
              <span className="text-muted-foreground">{formatSize(attachment.size)}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((current) => current.filter((a) => a.id !== attachment.id))
                }
                aria-label={`Remove ${attachment.name}`}
                className="grid size-4 place-items-center rounded-sm text-muted-foreground hover:text-danger"
              >
                <XIcon className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        {features.attachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={onFilesPicked}
              className="hidden"
              aria-hidden
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach files"
              title="Attach files"
              className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              <PaperclipIcon className="size-4" />
            </button>
          </>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder={branding.inputPlaceholder}
          aria-label={branding.inputPlaceholder}
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onKeyDown={onKeyDown}
          className="max-h-48 min-w-0 flex-1 resize-none self-center bg-transparent outline-none placeholder:text-muted-foreground"
        />

        {micSupported && (
          <button
            type="button"
            onClick={toggleRecording}
            aria-label={recording ? strings.micStop : strings.micStart}
            aria-pressed={recording}
            title={recording ? strings.micStop : strings.micStart}
            className={cx(
              'grid size-8 shrink-0 place-items-center rounded-md transition-colors',
              recording
                ? 'ck-mic-recording bg-danger text-danger-foreground'
                : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
            )}
          >
            <MicIcon className="size-4" />
          </button>
        )}

        {isGenerating ? (
          <button
            type="button"
            onClick={stopGenerating}
            aria-label={strings.stopGenerating}
            title={strings.stopGenerating}
            className="grid size-8 shrink-0 place-items-center rounded-md bg-foreground text-background transition-opacity hover:opacity-80"
          >
            <StopIcon className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label={strings.sendMessage}
            title={strings.sendMessage}
            className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <SendIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
