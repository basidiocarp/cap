export function parseJsonArray<T>(raw: string): T[] {
  try {
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}
