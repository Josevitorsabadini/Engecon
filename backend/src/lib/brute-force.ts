const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

interface Entry {
  count: number
  lockedUntil: number | null
}

const store = new Map<string, Entry>()

export function isLocked(key: string): boolean {
  const entry = store.get(key)
  if (!entry?.lockedUntil) return false
  if (Date.now() >= entry.lockedUntil) {
    store.delete(key)
    return false
  }
  return true
}

export function recordFailure(key: string): void {
  const entry = store.get(key) ?? { count: 0, lockedUntil: null }
  entry.count++
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_DURATION_MS
  }
  store.set(key, entry)
}

export function resetAttempts(key: string): void {
  store.delete(key)
}
