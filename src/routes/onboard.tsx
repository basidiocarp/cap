import { createFileRoute } from '@tanstack/react-router'

import { Onboard } from '../pages/Onboard'

export const Route = createFileRoute('/onboard')({
  component: Onboard,
})
