import { createFileRoute } from '@tanstack/react-router'

import { LessonsPage } from '../pages/lessons/LessonsPage'

export const Route = createFileRoute('/lessons')({
  component: LessonsPage,
})
