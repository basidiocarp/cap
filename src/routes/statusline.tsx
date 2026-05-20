import { createFileRoute } from '@tanstack/react-router'

import { StatuslinePage } from '../pages/statusline/StatuslinePage'

export const Route = createFileRoute('/statusline')({
  component: StatuslinePage,
})
