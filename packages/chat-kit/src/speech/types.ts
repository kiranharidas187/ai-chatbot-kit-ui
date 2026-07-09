export interface SpeechResult {
  transcript: string;
  /** Interim results stream while speaking; the final result replaces them. */
  isFinal: boolean;
}

export interface SpeechStartOptions {
  lang: string;
  onResult: (result: SpeechResult) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}

/**
 * Speech-to-text provider. The default uses the browser's Web Speech API;
 * consumers can plug a custom STT service instead.
 */
export interface SpeechAdapter {
  /** False when the environment can't support this adapter (mic button hides/disables). */
  isSupported(): boolean;
  start(options: SpeechStartOptions): void;
  stop(): void;
}
