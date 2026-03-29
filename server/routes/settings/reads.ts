import type { Hono } from 'hono'

import { activateMode, loadModes } from '../../lib/modes.ts'
import { logger } from '../../logger.ts'
import { getHyphaeSettings, getMyceliumSettings, getRhizomeSettings } from './config.ts'
import { buildStipeArgs, parseStipeAction, runStipe, runStipeJson } from './shared.ts'

export function registerReadRoutes(app: Hono) {
  app.get('/', async (c) => {
    try {
      const settings = {
        hyphae: getHyphaeSettings(),
        mycelium: getMyceliumSettings(),
        rhizome: getRhizomeSettings(),
      }
      return c.json(settings)
    } catch (err) {
      logger.error({ err }, 'Failed to read settings')
      return c.json({ error: 'Failed to read settings' }, 500)
    }
  })

  app.get('/modes', (c) => {
    try {
      return c.json(loadModes())
    } catch (err) {
      logger.error({ err }, 'Failed to load modes')
      return c.json({ error: 'Failed to load modes' }, 500)
    }
  })

  app.post('/modes/activate', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}))
      const mode = body.mode
      if (!mode || typeof mode !== 'string') {
        return c.json({ error: 'Missing required field: mode' }, 400)
      }
      const updated = activateMode(mode)
      return c.json(updated)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate mode'
      logger.error({ err }, 'Mode activation failed')
      return c.json({ error: message }, 400)
    }
  })

  app.post('/stipe/run', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}))
      const action = typeof body.action === 'string' ? parseStipeAction(body.action) : null

      if (!action) {
        return c.json({ error: 'Missing or invalid action' }, 400)
      }

      const args = buildStipeArgs(action)
      const output = await runStipe(args)

      return c.json({
        action,
        command: `stipe ${args.join(' ')}`,
        output,
      })
    } catch (err) {
      logger.error({ err }, 'Stipe action failed')
      return c.json({ error: 'Stipe action failed' }, 500)
    }
  })

  app.get('/stipe/repair-plan', async (c) => {
    try {
      const [doctor, initPlan] = await Promise.all([runStipeJson(['doctor']), runStipeJson(['init', '--dry-run'])])

      return c.json({
        doctor,
        init_plan: initPlan,
      })
    } catch (err) {
      logger.error({ err }, 'Failed to load Stipe repair plan')
      return c.json({ error: 'Failed to load Stipe repair plan' }, 500)
    }
  })
}
