import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/canopy')({
  component: () => import('../pages/canopy/CanopyPage').then((m) => ({ default: m.CanopyPage })),
})
