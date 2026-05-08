import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/memoirs')({
  component: () => import('../pages/memoirs/MemoirsPage').then((m) => ({ default: m.MemoirsPage })),
})
