import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/memories')({
  component: () => import('../pages/memories/MemoriesPage').then((m) => ({ default: m.MemoriesPage })),
})
