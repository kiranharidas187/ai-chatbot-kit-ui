import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { MicIcon, SendIcon, StopIcon } from '../../icons';
import { webSpeechAdapter } from '../../speech/webSpeech';
import { useChatKitConfig } from '../../state/ChatKitProvider';
import { useChat } from '../../state/useChat';
import { cx } from '../internal/cx';

export interface ChatComposerProps {
  className?: string | undefined;
}

/** Message input: auto-growing textarea, Enter to send, stop while generating. */
export function ChatComposer({ className }: ChatComposerProps) {
  const { branding, strings, features, speech } = useChatKitConfig();
  const { sendMessage, stopGenerating, isGenerating } = useChat();
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Text present when recording started; the live transcript appends to it.
  const voiceBaseRef = useRef('');

  const speechAdapter = useMemo(() => speech.adapter ?? webSpeechAdapter(), [speech.adapter]);
  const micSupported = features.mic && speechAdapter.isSupported();

  useEffect(() => () => speechAdapter.stop(), [speechAdapter]);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, []);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isGenerating) return;
    sendMessage(trimmed);
    setValue('');
    requestAnimationFrame(resize);
  }, [value, isGenerating, sendMessage, resize]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
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

  const canSend = value.trim().length > 0 && !isGenerating;

  return (
    <div
      className={cx(
        'flex items-end gap-2 rounded-lg border bg-surface px-3 py-2',
        'focus-within:border-accent',
        className,
      )}
    >
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
          className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <SendIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
