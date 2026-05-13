import { createFileRoute } from '@tanstack/react-router'

import { DiagnosticsPage } from '../pages/diagnostics/DiagnosticsPage'

export const Route = createFileRoute('/diagnostics')({
  component: DiagnosticsPage,
})
