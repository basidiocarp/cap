export function relevanceColor(score: number): string {
  if (score >= 0.8) return 'mycelium'
  if (score >= 0.5) return 'fruiting'
  return 'substrate'
}

export function sourceLabel(source: string): string {
  switch (source) {
    case 'memory':
      return 'Memory'
    case 'error':
      return 'Error'
    case 'session':
      return 'Session'
    case 'code':
      return 'Code'
    default:
      return source
  }
}
