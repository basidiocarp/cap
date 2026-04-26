import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'

import { computeBudgetStatus, getBudgetConfig, getCostSummary, recordCostEntry, setBudgetConfig } from '../lib/capDb.ts'

const app = new Hono()

interface CostEntryInput {
  session_id: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number
}

// POST / — record a cost entry
app.post('/', async (c) => {
  try {
    const body = (await c.req.json()) as CostEntryInput

    // Validate input
    if (!body.session_id || !body.model) {
      return c.json({ error: 'session_id and model are required' }, 400)
    }

    // Generate entry_id (using randomUUID as per handoff)
    const entry_id = randomUUID()

    // Record the cost entry
    recordCostEntry({
      completion_tokens: body.completion_tokens || 0,
      cost_usd: body.cost_usd || 0,
      entry_id,
      model: body.model,
      prompt_tokens: body.prompt_tokens || 0,
      session_id: body.session_id,
    })

    // Compute budget status (pass session_id to enforce per-session limit)
    const budgetStatus = computeBudgetStatus(body.session_id)

    // Handle budget exceeded
    if (budgetStatus.status === 'exceeded') {
      return c.json(
        {
          limit_usd: budgetStatus.limit_usd,
          spent_usd: budgetStatus.spent_usd,
          status: 'exceeded',
        },
        402
      )
    }

    // Include budget status in response
    const response = c.json({ entry_id, status: budgetStatus })

    // Add warning header if approaching limit
    if (budgetStatus.status === 'warning') {
      response.headers.set('X-Budget-Status', 'warning')
    }

    return response
  } catch (err) {
    console.error('Error recording cost entry:', err)
    return c.json({ error: 'Failed to record cost entry' }, 500)
  }
})

// GET /summary — aggregate spend by day/week/month
app.get('/summary', (c) => {
  try {
    const summary = getCostSummary()
    return c.json(summary)
  } catch (err) {
    console.error('Error getting cost summary:', err)
    return c.json({ error: 'Failed to get cost summary' }, 500)
  }
})

// GET /budget/status — return current BudgetStatus
app.get('/budget/status', (c) => {
  try {
    const status = computeBudgetStatus()
    return c.json(status)
  } catch (err) {
    console.error('Error getting budget status:', err)
    return c.json({ error: 'Failed to get budget status' }, 500)
  }
})

// PUT /budget — update BudgetConfig
app.put('/budget', async (c) => {
  try {
    const body = (await c.req.json()) as Partial<{
      daily_limit_usd: number | null
      weekly_limit_usd: number | null
      monthly_limit_usd: number | null
      per_session_limit_usd: number | null
      warn_at_percent: number
    }>

    setBudgetConfig(body)
    const updated = getBudgetConfig()
    return c.json(updated)
  } catch (err) {
    console.error('Error updating budget config:', err)
    return c.json({ error: 'Failed to update budget config' }, 500)
  }
})

export default app
