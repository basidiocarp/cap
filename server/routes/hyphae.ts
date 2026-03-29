import { Hono } from 'hono'

import readRoutes from './hyphae/reads.ts'
import writeRoutes from './hyphae/writes.ts'

const app = new Hono()

app.route('/', readRoutes)
app.route('/', writeRoutes)

export default app
