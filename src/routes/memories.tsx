import { createFileRoute } from '@tanstack/react-router'

import { MemoriesPage } from '../pages/memories/MemoriesPage'

export const Route = createFileRoute('/memories')({
  component: MemoriesPage,
})
