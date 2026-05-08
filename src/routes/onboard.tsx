import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/onboard')({
  component: () => import('../pages/Onboard').then((m) => ({ default: m.Onboard })),
})
