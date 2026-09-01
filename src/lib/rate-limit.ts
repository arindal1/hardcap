/**
 * In-memory sliding-window rate limiter. Per-process only — resets on
 * deploy/restart and does not coordinate across multiple server instances.
 * Sufficient as a best-effort guard against brute-force/spam on
 * unauthenticated endpoints for a single-instance deployment; swap for a
 * shared store (e.g. Redis) if scaled horizontally.
 */

const attempts = new Map<string, number[]>();

// Keys are attacker-influenced (email, IP). Without eviction, an attacker
// cycling through distinct keys (e.g. one login attempt per email address)
// grows this map forever and never triggers the cleanup path inside
// isRateLimited (which only prunes a key when that same key is looked up
// again). Sweep periodically so unused keys don't leak memory indefinitely.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
const MAX_KEY_AGE_MS = 60 * 60 * 1000;

const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of attempts) {
    const fresh = timestamps.filter((t) => now - t < MAX_KEY_AGE_MS);
    if (fresh.length === 0) attempts.delete(key);
    else attempts.set(key, fresh);
  }
}, SWEEP_INTERVAL_MS);
sweepTimer.unref?.();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    attempts.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  attempts.set(key, timestamps);
  return false;
}

/**
 * Best-effort client IP extraction for rate-limit keys. Plain `x-forwarded-for`
 * is attacker-controlled: a client can send its own value and, depending on
 * the proxy chain, it is only appended to (not replaced), so the leftmost
 * entry can't be trusted as-is. Preference order:
 *   1. `x-vercel-forwarded-for` — set by Vercel's edge network itself on the
 *      assumed hosting target, not client-settable.
 *   2. `x-real-ip` — set by most conventional reverse proxies (nginx, etc.)
 *      to the real connecting peer, not client-settable when configured
 *      correctly.
 *   3. Rightmost entry of `x-forwarded-for` — the value appended by the
 *      hop closest to this server, which is the most trustworthy segment
 *      of an otherwise client-influenced chain.
 * This is still best-effort behind an untrusted/misconfigured proxy — it
 * cannot be made fully spoof-proof without knowing the exact proxy topology.
 */
export function getClientIp(request: Request): string {
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0]?.trim() ?? "unknown";

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim());
    return parts[parts.length - 1] || "unknown";
  }

  return "unknown";
}