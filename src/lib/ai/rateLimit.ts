// Simple in-memory per-IP sliding-window limiter for the AI chat assistant.
// This app runs as a single PM2 process behind Nginx, so an in-process Map
// is a reasonable soft cap against cost-driving abuse -- it resets on
// deploy/restart, which is fine since this isn't a security boundary, just
// a guard against one visitor burning API spend in a loop.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
}
