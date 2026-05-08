import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/code')({
  component: () => import('../pages/code-explorer/CodeExplorerPage').then((m) => ({ default: m.CodeExplorerPage })),
})
