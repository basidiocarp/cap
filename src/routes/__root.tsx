import { createRootRoute } from '@tanstack/react-router'

import { AppLayout } from '../components/AppLayout'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { TweaksPanel } from '../components/TweaksPanel'

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <AppLayout />
      {import.meta.env.DEV && <TweaksPanel />}
    </ErrorBoundary>
  ),
})
