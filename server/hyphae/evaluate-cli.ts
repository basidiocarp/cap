import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { logger } from '../logger.ts'

const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')

export interface EvaluationPeriodMetric {
  name: string
  previous: string
  recent: string
  trend: 'improving' | 'declining' | 'stable' | 'unknown'
}

export interface EvaluationResult {
  days: number
  half_days: number
  overall_verdict: string
  metrics: EvaluationPeriodMetric[]
  recall_non_zero_rate: string | null
  recall_avg_effectiveness: string | null
}

export class HyphaeEvaluateCliError extends Error {
  kind: 'invalid_payload' | 'unavailable'

  constructor(message: string, kind: 'invalid_payload' | 'unavailable', options?: { cause?: unknown }) {
    super(message, options)
    this.kind = kind
    this.name = 'HyphaeEvaluateCliError'
  }
}

function parseTrend(trendStr: string): 'improving' | 'declining' | 'stable' | 'unknown' {
  const normalized = trendStr.toLowerCase().trim()
  if (normalized.includes('↑') || normalized.includes('improving')) return 'improving'
  if (normalized.includes('↓') || normalized.includes('declining')) return 'declining'
  if (normalized.includes('→') || normalized.includes('stable')) return 'stable'
  return 'unknown'
}

function parseMetricTable(lines: string[]): EvaluationPeriodMetric[] {
  const metrics: EvaluationPeriodMetric[] = []
  let inMetricTable = false
  let headerSeen = false

  for (const line of lines) {
    // Start of metric table (first table after "Agent Evaluation Report")
    if (line.includes('Metric') && line.includes('Previous 7d') && line.includes('Recent 7d')) {
      inMetricTable = true
      headerSeen = true
      continue
    }

    // Skip header separator lines and empty lines
    if (!line.trim() || /^-+\s*/.test(line)) {
      continue
    }

    // Exit metric table when we hit the "Overall:" line or "Recall effectiveness" section
    if (line.includes('Overall:') || line.includes('Recall effectiveness')) {
      inMetricTable = false
      break
    }

    if (inMetricTable && headerSeen) {
      // Parse metric rows
      // Format: "Metric Name     Previous Value    Recent Value  Trend Symbol"
      const parts = line.split(/\s{2,}/)
      if (parts.length >= 4) {
        const name = parts[0].trim()
        const previous = parts[1].trim()
        const recent = parts[2].trim()
        const trend = parseTrend(parts.slice(3).join(' '))

        if (name && previous && recent) {
          metrics.push({ name, previous, recent, trend })
        }
      }
    }
  }

  return metrics
}

function parseRecallEffectiveness(lines: string[]): { nonZeroRate: string | null; avgEffectiveness: string | null } {
  let nonZeroRate: string | null = null
  let avgEffectiveness: string | null = null
  let inRecallTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.includes('Recall effectiveness')) {
      inRecallTable = true
      continue
    }

    if (inRecallTable) {
      // Skip header separator and empty lines
      if (/^-+\s*/.test(line) || !line.trim()) {
        continue
      }

      // Parse recall metric rows
      const parts = line.split(/\s{2,}/)
      if (parts.length >= 2) {
        const metric = parts[0].trim()
        const value = parts[1].trim()

        if (metric.includes('Non-zero score rate')) {
          nonZeroRate = value
        } else if (metric.includes('Average effectiveness')) {
          avgEffectiveness = value
        }
      }

      // Stop parsing recall section when we hit "Top recalled" or empty section
      if (line.includes('Top recalled') || line.includes('Overall:')) {
        break
      }
    }
  }

  return { nonZeroRate, avgEffectiveness }
}

function parseEvaluation(stdout: string, days: number): EvaluationResult {
  const lines = stdout.split('\n')

  // Find the "Overall:" line
  let overallVerdict = ''
  for (const line of lines) {
    if (line.includes('Overall:')) {
      overallVerdict = line.replace(/^.*Overall:\s*/, '').trim()
      break
    }
  }

  const metrics = parseMetricTable(lines)
  const { nonZeroRate, avgEffectiveness } = parseRecallEffectiveness(lines)

  if (metrics.length === 0 && !overallVerdict) {
    throw new HyphaeEvaluateCliError('Hyphae evaluate returned an invalid payload', 'invalid_payload')
  }

  return {
    days,
    half_days: Math.floor(days / 2),
    overall_verdict: overallVerdict || 'Unable to evaluate',
    metrics,
    recall_non_zero_rate: nonZeroRate,
    recall_avg_effectiveness: avgEffectiveness,
  }
}

async function runEvaluateCli(days: number): Promise<EvaluationResult> {
  try {
    const stdout = await runCli(['--all-projects', 'evaluate', '--days', String(days)])
    return parseEvaluation(stdout, days)
  } catch (err) {
    if (err instanceof HyphaeEvaluateCliError) throw err
    logger.debug({ err }, 'Failed to load Hyphae evaluate from CLI')
    throw new HyphaeEvaluateCliError('Failed to load Hyphae evaluate from CLI', 'unavailable', { cause: err })
  }
}

export async function getEvaluation(days: number): Promise<EvaluationResult> {
  return runEvaluateCli(days)
}
