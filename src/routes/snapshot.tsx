import { createFileRoute } from '@tanstack/react-router'

import { SnapshotPage } from '../pages/snapshot/SnapshotPage'

export const Route = createFileRoute('/snapshot')({
  component: SnapshotPage,
})
