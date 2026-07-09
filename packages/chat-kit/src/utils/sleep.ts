/** Abortable sleep: rejects with an AbortError when the signal fires. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(toAbortError(signal.reason));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(toAbortError(signal.reason));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function toAbortError(reason: unknown): Error {
  return reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError');
}
