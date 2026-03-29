import { Hono } from 'hono'

import { registerAnalyticsRoutes, registerStatusRoute } from './rhizome/analytics.ts'
import { registerEditRoutes } from './rhizome/edits.ts'
import { registerProjectRoutes } from './rhizome/project.ts'
import { registerReadRoutes } from './rhizome/reads.ts'
import { requireAvailability } from './rhizome/shared.ts'

const app = new Hono()
registerAnalyticsRoutes(app)
requireAvailability(app)
registerStatusRoute(app)
registerReadRoutes(app)
registerEditRoutes(app)
registerProjectRoutes(app)

export default app
