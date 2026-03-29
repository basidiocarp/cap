import { Hono } from 'hono'

import { registerReadRoutes } from './settings/reads.ts'

export { buildStipeArgs, parseStipeAction } from './settings/shared.ts'

import { registerWriteRoutes } from './settings/writes.ts'

const app = new Hono()
registerReadRoutes(app)
registerWriteRoutes(app)

export default app
