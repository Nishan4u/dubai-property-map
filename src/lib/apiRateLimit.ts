// Same in-memory sliding-window shape as src/lib/ai/rateLimit.ts, kept as
// its own file/window since the Public API's usage pattern (scripted,
// per-key, potentially bursty) is different from the AI chat's per-IP
// visitor pattern -- a shared window would let one abusive API key crowd
// out AI chat visitors or vice versa.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 120;

const hits = new Map<string, number[]>();

export function isApiRateLimited(apiKeyId: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const recent = (hits.get(apiKeyId) ?? []).filter((t) => t > windowStart);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(apiKeyId, recent);
    return true;
  }

  recent.push(now);
  hits.set(apiKeyId, recent);
  return false;
}
