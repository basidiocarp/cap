import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/diagnostics')({
  component: () => import('../pages/diagnostics/DiagnosticsPage').then((m) => ({ default: m.DiagnosticsPage })),
})
