import { createFileRoute } from '@tanstack/react-router'

import { MemoirGraphPage } from '../pages/memoir-graph/MemoirGraphPage'

export const Route = createFileRoute('/memoir-graph')({
  component: MemoirGraphPage,
})
