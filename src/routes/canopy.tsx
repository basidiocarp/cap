import { createFileRoute } from '@tanstack/react-router'

import { CanopyPage } from '../pages/canopy/CanopyPage'

export const Route = createFileRoute('/canopy')({
  component: CanopyPage,
})
