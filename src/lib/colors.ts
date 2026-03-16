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
