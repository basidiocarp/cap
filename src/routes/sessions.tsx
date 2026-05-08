import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/sessions')({
  component: () => import('../pages/sessions/SessionsPage').then((m) => ({ default: m.SessionsPage })),
})
