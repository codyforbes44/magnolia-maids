/**
 * Shared retry helper for outbound provider calls (Twilio, Resend, ElevenLabs).
 * Retries only on transient conditions — network errors, 408/429 and 5xx —
 * with exponential backoff plus jitter, and honours Retry-After when given.
 */
export type RetryOptions = {
  /** Total attempts, including the first. */
  attempts?: number;
  /** Base delay in ms for the exponential backoff. */
  baseDelayMs?: number;
  maxDelayMs?: number;
  label?: string;
};

const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isRetryableStatus(status: number) {
  return RETRYABLE_STATUS.has(status);
}

/** Fetch with retry. Returns the last response (even if it failed). */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: RetryOptions = {},
): Promise<{ response: Response | null; attempts: number; error: string | null }> {
  const attempts = options.attempts ?? 3;
  const base = options.baseDelayMs ?? 400;
  const max = options.maxDelayMs ?? 8000;
  const label = options.label ?? "fetch";

  let lastError: string | null = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || !isRetryableStatus(response.status) || attempt === attempts) {
        return { response, attempts: attempt, error: null };
      }
      const retryAfter = Number(response.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, max)
        : Math.min(base * 2 ** (attempt - 1), max) + Math.random() * 200;
      console.warn(`[retry] ${label} attempt ${attempt} got ${response.status}; retrying in ${Math.round(wait)}ms`);
      await sleep(wait);
    } catch (e) {
      lastError = String(e).slice(0, 400);
      if (attempt === attempts) break;
      const wait = Math.min(base * 2 ** (attempt - 1), max) + Math.random() * 200;
      console.warn(`[retry] ${label} attempt ${attempt} threw ${lastError}; retrying in ${Math.round(wait)}ms`);
      await sleep(wait);
    }
  }
  return { response: null, attempts, error: lastError ?? "network_error" };
}
