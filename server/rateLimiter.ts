import crypto from 'node:crypto';

export interface RateLimitStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
}

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

const EPHEMERAL_SALT = crypto.randomBytes(32);
const requestBuckets = new Map<string, number[]>();

const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, timestamps] of requestBuckets.entries()) {
    const active = timestamps.filter((t) => t > cutoff);
    if (active.length === 0) {
      requestBuckets.delete(key);
    } else {
      requestBuckets.set(key, active);
    }
  }
}, 10 * 60 * 1000);

cleanupTimer.unref();

function hashClientKey(rawIp: string): string {
  return crypto
    .createHmac('sha256', EPHEMERAL_SALT)
    .update(rawIp)
    .digest('hex');
}

export function checkAndConsumeRateLimit(rawIp: string): RateLimitStatus {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const key = hashClientKey(rawIp || 'unknown');

  const existing = requestBuckets.get(key) ?? [];
  const activeTimestamps = existing.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = activeTimestamps[0] ?? now;
    const resetAtMs = oldest + WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - now) / 1000));
    requestBuckets.set(key, activeTimestamps);
    return {
      allowed: false,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: 0,
      resetAtMs,
      retryAfterSeconds,
    };
  }

  activeTimestamps.push(now);
  requestBuckets.set(key, activeTimestamps);

  const oldest = activeTimestamps[0] ?? now;
  const resetAtMs = oldest + WINDOW_MS;

  return {
    allowed: true,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - activeTimestamps.length),
    resetAtMs,
    retryAfterSeconds: 0,
  };
}

export function refundRateLimitSlot(rawIp: string): RateLimitStatus {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const key = hashClientKey(rawIp || 'unknown');
  const activeTimestamps = (requestBuckets.get(key) ?? []).filter(
    (ts) => ts > windowStart
  );
  if (activeTimestamps.length > 0) {
    activeTimestamps.pop();
    if (activeTimestamps.length === 0) {
      requestBuckets.delete(key);
    } else {
      requestBuckets.set(key, activeTimestamps);
    }
  }
  return peekRateLimit(rawIp);
}

export function peekRateLimit(rawIp: string): RateLimitStatus {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const key = hashClientKey(rawIp || 'unknown');
  const activeTimestamps = (requestBuckets.get(key) ?? []).filter(
    (ts) => ts > windowStart
  );
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - activeTimestamps.length);
  const oldest = activeTimestamps[0] ?? now;
  const resetAtMs = oldest + WINDOW_MS;

  return {
    allowed: remaining > 0,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining,
    resetAtMs,
    retryAfterSeconds:
      remaining > 0 ? 0 : Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
  };
}
