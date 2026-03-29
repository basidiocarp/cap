export function mergeCountMaps(target: Record<string, number>, source: Record<string, number>): Record<string, number> {
  const result = { ...target }
  for (const [key, count] of Object.entries(source)) {
    result[key] = (result[key] ?? 0) + count
  }
  return result
}

export function mergeFileMaps(
  target: Record<string, { edits: number; reads: number }>,
  source: Record<string, { edits: number; reads: number }>
): Record<string, { edits: number; reads: number }> {
  const result: Record<string, { edits: number; reads: number }> = {}
  for (const key of new Set([...Object.keys(target), ...Object.keys(source)])) {
    const targetEntry = target[key] ?? { edits: 0, reads: 0 }
    const sourceEntry = source[key] ?? { edits: 0, reads: 0 }
    result[key] = {
      edits: targetEntry.edits + sourceEntry.edits,
      reads: targetEntry.reads + sourceEntry.reads,
    }
  }
  return result
}
