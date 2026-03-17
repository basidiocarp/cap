export function symbolKindColor(kind: string): string {
  switch (kind.toLowerCase()) {
    case 'function':
    case 'method':
      return 'mycelium'
    case 'class':
    case 'struct':
      return 'spore'
    case 'enum':
      return 'substrate'
    case 'interface':
    case 'trait':
      return 'lichen'
    case 'constant':
    case 'const':
      return 'gill'
    case 'import':
    case 'use':
      return 'chitin'
    default:
      return 'chitin'
  }
}

export function importanceColor(importance: string): string {
  switch (importance.toLowerCase()) {
    case 'critical':
      return 'gill'
    case 'high':
      return 'fruiting'
    case 'medium':
      return 'lichen'
    case 'low':
      return 'chitin'
    default:
      return 'chitin'
  }
}

export function relationColor(relation: string): string {
  switch (relation.toLowerCase()) {
    case 'depends_on':
    case 'uses':
      return 'mycelium'
    case 'implements':
    case 'extends':
      return 'spore'
    case 'related_to':
    case 'associated_with':
      return 'lichen'
    case 'contradicts':
    case 'conflicts_with':
      return 'gill'
    case 'part_of':
    case 'contains':
      return 'substrate'
    default:
      return 'chitin'
  }
}

export function weightColor(w: number): string {
  if (w > 0.7) return 'mycelium.7'
  if (w >= 0.3) return 'substrate.6'
  return 'decay.5'
}

export function annotationColor(kind: string): string {
  switch (kind.toUpperCase()) {
    case 'TODO':
      return 'substrate'
    case 'FIXME':
      return 'gill'
    case 'HACK':
      return 'decay'
    default:
      return 'chitin'
  }
}

export function complexityColor(score: number): string {
  if (score < 5) return 'green'
  if (score <= 10) return 'yellow'
  return 'red'
}

export const PIE_COLORS = ['spore.6', 'fruiting.6', 'mycelium.6', 'chitin.5', 'lichen.6', 'gill.6']
