import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/analytics')({
  component: () => import('../pages/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
})
