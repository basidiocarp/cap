import { createFileRoute } from '@tanstack/react-router'

import { CodeExplorerPage } from '../pages/code-explorer/CodeExplorerPage'

export const Route = createFileRoute('/code')({
  component: CodeExplorerPage,
})
