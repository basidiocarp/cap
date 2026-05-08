import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/memoir-graph')({
  component: () => import('../pages/memoir-graph/MemoirGraphPage').then((m) => ({ default: m.MemoirGraphPage })),
})
