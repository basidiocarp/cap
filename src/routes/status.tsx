import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/status')({
  component: () => import('../pages/Status').then((m) => ({ default: m.Status })),
})
