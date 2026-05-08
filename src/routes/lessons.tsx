import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/lessons')({
  component: () => import('../pages/lessons/LessonsPage').then((m) => ({ default: m.LessonsPage })),
})
