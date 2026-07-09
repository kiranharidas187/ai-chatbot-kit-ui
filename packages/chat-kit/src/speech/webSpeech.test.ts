import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SpeechResult } from './types';
import { webSpeechAdapter } from './webSpeech';

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = '';
  interimResults = false;
  continuous = false;
  onresult: ((event: { results: unknown[] }) => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;

  constructor() {
    FakeRecognition.instances.push(this);
  }

  start() {
    this.started = true;
  }

  stop() {
    this.onend?.();
  }

  emitResults(parts: Array<{ text: string; isFinal: boolean }>) {
    this.onresult?.({
      results: parts.map((p) => ({ isFinal: p.isFinal, 0: { transcript: p.text } })),
    });
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeRecognition.instances = [];
});

function stubWindow() {
  vi.stubGlobal('window', { SpeechRecognition: FakeRecognition });
}

describe('webSpeechAdapter', () => {
  it('reports unsupported without a recognition constructor', () => {
    vi.stubGlobal('window', {});
    expect(webSpeechAdapter().isSupported()).toBe(false);
  });

  it('assembles the full transcript across final and interim results', () => {
    stubWindow();
    const adapter = webSpeechAdapter();
    expect(adapter.isSupported()).toBe(true);

    const results: SpeechResult[] = [];
    adapter.start({
      lang: 'en-US',
      onResult: (r) => results.push(r),
      onError: () => {},
      onEnd: () => {},
    });

    const rec = FakeRecognition.instances[0]!;
    expect(rec.started).toBe(true);
    expect(rec.lang).toBe('en-US');
    expect(rec.interimResults).toBe(true);

    rec.emitResults([{ text: 'hello ', isFinal: true }, { text: 'wor', isFinal: false }]);
    rec.emitResults([{ text: 'hello ', isFinal: true }, { text: 'world', isFinal: true }]);

    expect(results).toEqual([
      { transcript: 'hello wor', isFinal: false },
      { transcript: 'hello world', isFinal: true },
    ]);
  });

  it('fires onEnd when recognition stops and swallows benign errors', () => {
    stubWindow();
    const adapter = webSpeechAdapter();
    const onEnd = vi.fn();
    const onError = vi.fn();
    adapter.start({ lang: 'en-US', onResult: () => {}, onError, onEnd });

    const rec = FakeRecognition.instances[0]!;
    rec.onerror?.({ error: 'no-speech' });
    expect(onError).not.toHaveBeenCalled();
    rec.onerror?.({ error: 'not-allowed' });
    expect(onError).toHaveBeenCalledWith('not-allowed');

    adapter.stop();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
