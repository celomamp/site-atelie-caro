// lib/ratelimit.ts
const attempts = new Map<string, number[]>();

export function hit(
  key: string,
  opts?: { limit?: number; windowMs?: number },
): { ok: boolean; retryAfter: number } {
  const limit = opts?.limit ?? 5;
  const windowMs = opts?.windowMs ?? 600000;
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - timestamps[0])) / 1000);
    return { ok: false, retryAfter };
  }
  timestamps.push(now);
  attempts.set(key, timestamps);
  return { ok: true, retryAfter: 0 };
}

export function resetRatelimit() {
  attempts.clear();
}
