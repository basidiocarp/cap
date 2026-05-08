import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/symbols')({
  component: () => import('../pages/symbol-search/SymbolSearchPage').then((m) => ({ default: m.SymbolSearchPage })),
})
