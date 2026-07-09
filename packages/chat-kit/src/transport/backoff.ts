import type { RetryPolicy } from './types';

export const DEFAULT_RETRY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 4000,
};

export function backoffDelay(attempt: number, retry: RetryPolicy): number {
  return Math.min(retry.initialDelayMs * 2 ** attempt, retry.maxDelayMs);
}
