export function cached<T>(fn: () => T, ttlMs: number): () => T {
  let entry: { data: T; ts: number } | null = null
  return () => {
    const now = Date.now()
    if (entry && now - entry.ts < ttlMs) return entry.data
    const data = fn()
    entry = { data, ts: now }
    return data
  }
}

export function cachedAsync<T>(fn: () => Promise<T>, ttlMs: number): () => Promise<T> {
  let entry: { data: T; ts: number } | null = null
  return async () => {
    const now = Date.now()
    if (entry && now - entry.ts < ttlMs) return entry.data
    const data = await fn()
    entry = { data, ts: now }
    return data
  }
}
