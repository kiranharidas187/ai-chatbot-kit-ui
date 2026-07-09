import type { SpeechAdapter, SpeechStartOptions } from './types';

/* Minimal Web Speech API typings — not in TS's dom lib for the webkit variant. */
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionResultEvent {
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  error?: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Default STT provider on top of the browser's Web Speech API.
 * Contract: each onResult carries the FULL transcript of the current
 * recording so far (finalized + interim); isFinal is true when all of it is
 * finalized. The composer appends it to whatever was typed before recording.
 */
export function webSpeechAdapter(): SpeechAdapter {
  let recognition: SpeechRecognitionLike | null = null;

  return {
    isSupported: () => getRecognitionCtor() !== null,

    start(options: SpeechStartOptions): void {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        options.onError('Speech recognition is not supported in this browser.');
        options.onEnd();
        return;
      }
      const instance = new Ctor();
      recognition = instance;
      instance.lang = options.lang;
      instance.interimResults = true;
      instance.continuous = true;

      instance.onresult = (event) => {
        let transcript = '';
        let allFinal = true;
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]!;
          transcript += result[0].transcript;
          if (!result.isFinal) allFinal = false;
        }
        options.onResult({ transcript, isFinal: allFinal });
      };
      instance.onerror = (event) => {
        // 'no-speech'/'aborted' are normal endings, not errors worth surfacing.
        if (event.error && event.error !== 'no-speech' && event.error !== 'aborted') {
          options.onError(event.error);
        }
      };
      instance.onend = () => {
        if (recognition === instance) recognition = null;
        options.onEnd();
      };
      instance.start();
    },

    stop(): void {
      recognition?.stop();
      recognition = null;
    },
  };
}
