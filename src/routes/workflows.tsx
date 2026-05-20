import { createFileRoute } from '@tanstack/react-router'

import { WorkflowsPage } from '../pages/workflows/WorkflowsPage'

export const Route = createFileRoute('/workflows')({
  component: WorkflowsPage,
})
