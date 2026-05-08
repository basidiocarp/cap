export interface CostEntry {
  entry_id: string
  session_id: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number
  recorded_at: string
}

export interface CostSummary {
  today_usd: number
  week_usd: number
  month_usd: number
}

export type BudgetStatus =
  | { status: 'ok'; spent_usd: number; limit_usd: number | null }
  | { status: 'warning'; spent_usd: number; limit_usd: number; percent: number }
  | { status: 'exceeded'; spent_usd: number; limit_usd: number }

export interface BudgetConfig {
  id: number
  daily_limit_usd: number | null
  weekly_limit_usd: number | null
  monthly_limit_usd: number | null
  per_session_limit_usd: number | null
  warn_at_percent: number
}

const API_BASE = '/api/cost'

export async function recordCost(entry: Omit<CostEntry, 'entry_id' | 'recorded_at'>): Promise<{ entry_id: string; status: BudgetStatus }> {
  const res = await fetch(`${API_BASE}/`, {
    body: JSON.stringify(entry),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error || `Failed to record cost: ${res.status}`)
  }

  return res.json()
}

export async function getCostSummary(): Promise<CostSummary> {
  const res = await fetch(`${API_BASE}/summary`)

  if (!res.ok) {
    throw new Error(`Failed to get cost summary: ${res.status}`)
  }

  return res.json()
}

export async function getBudgetStatus(): Promise<BudgetStatus> {
  const res = await fetch(`${API_BASE}/budget/status`)

  if (!res.ok) {
    throw new Error(`Failed to get budget status: ${res.status}`)
  }

  return res.json()
}

export async function updateBudgetConfig(config: Partial<BudgetConfig>): Promise<BudgetConfig> {
  const res = await fetch(`${API_BASE}/budget`, {
    body: JSON.stringify(config),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  })

  if (!res.ok) {
    throw new Error(`Failed to update budget config: ${res.status}`)
  }

  return res.json()
}
