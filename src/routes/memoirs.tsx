import { createFileRoute } from '@tanstack/react-router'

import { MemoirsPage } from '../pages/memoirs/MemoirsPage'

export const Route = createFileRoute('/memoirs')({
  component: MemoirsPage,
})
