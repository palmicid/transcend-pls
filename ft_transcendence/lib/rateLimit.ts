const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

const store = new Map<string, { count: number; ts: number }>()

export function rateLimit(key: string) {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.ts > WINDOW_MS) {
    store.set(key, { count: 1, ts: now })
    return true
  }

  if (entry.count >= MAX_REQUESTS) {
    return false
  }

  entry.count++
  return true
}
