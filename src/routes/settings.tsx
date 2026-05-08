import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/settings')({
  component: () => import('../pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
})
