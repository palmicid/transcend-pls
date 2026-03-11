const WINDOW_MS = 60_000;
const MAX_REQUESTS = 3;

const store = new Map<string, { count: number; ts: number }>();

export function rateLimit(key: string) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.ts > WINDOW_MS) {
    store.set(key, { count: 1, ts: now });
    return {
      allowed: true,
      retryAfter: 0,
    };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((WINDOW_MS - (now - entry.ts)) / 1000),
    };
  }

  entry.count++;

  return {
    allowed: true,
    retryAfter: 0,
  };
}
