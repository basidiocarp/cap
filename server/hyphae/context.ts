import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { logger } from '../logger.ts'

const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')
const GATHER_CONTEXT_SCHEMA_VERSION = '1.0'

export interface ContextEntry {
  content: string
  relevance: number
  source: string
  symbol?: string
  topic?: string
}

export interface GatherContextOptions {
  budget?: number
  include?: string
  project?: string
  projectRoot?: string
  scope?: string
  worktreeId?: string
}

export interface GatherContextResult {
  context: ContextEntry[]
  sources_queried: string[]
  tokens_budget: number
  tokens_used: number
}

export class HyphaeContextCliError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'HyphaeContextCliError'
  }
}

function parseGatherContext(stdout: string, tokensBudget: number): GatherContextResult {
  try {
    const parsed = JSON.parse(stdout) as (Partial<GatherContextResult> & { schema_version?: string }) | null
    if (
      !parsed ||
      parsed.schema_version !== GATHER_CONTEXT_SCHEMA_VERSION ||
      !Array.isArray(parsed.context) ||
      !Array.isArray(parsed.sources_queried)
    ) {
      throw new HyphaeContextCliError('Hyphae gather-context returned an invalid payload')
    }

    return {
      context: parsed.context,
      sources_queried: parsed.sources_queried.filter((source): source is string => typeof source === 'string'),
      tokens_budget: typeof parsed.tokens_budget === 'number' ? parsed.tokens_budget : tokensBudget,
      tokens_used: typeof parsed.tokens_used === 'number' ? parsed.tokens_used : 0,
    }
  } catch (err) {
    logger.debug({ err }, 'Failed to parse Hyphae gather-context CLI output')
    throw new HyphaeContextCliError('Failed to parse Hyphae gather-context CLI output', { cause: err })
  }
}

export async function gatherContext(task: string, options: GatherContextOptions = {}): Promise<GatherContextResult> {
  const budget = options.budget ?? 2000
  const args = ['gather-context', '--task', task, '--token-budget', String(budget)]

  if (options.project) {
    args.unshift('--project', options.project)
  } else {
    args.push('--all-projects')
  }

  if (options.projectRoot) {
    args.push('--project-root', options.projectRoot)
  }
  if (options.worktreeId) {
    args.push('--worktree-id', options.worktreeId)
  }
  if (options.scope) {
    args.push('--scope', options.scope)
  }

  for (const source of options.include
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) ?? []) {
    args.push('--include', source)
  }

  try {
    const stdout = await runCli(args)
    return parseGatherContext(stdout, budget)
  } catch (err) {
    logger.debug({ err }, 'Failed to load Hyphae gather-context from CLI')
    throw new HyphaeContextCliError('Failed to load Hyphae gather-context from CLI', { cause: err })
  }
}
