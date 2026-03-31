import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

let hyphaeBin = 'hyphae'

vi.mock('../lib/config.ts', async () => {
  const actual = await vi.importActual<typeof import('../lib/config.ts')>('../lib/config.ts')
  return { ...actual, HYPHAE_BIN: hyphaeBin }
})

interface ContractConsumers {
  gatherContext: typeof import('../hyphae/context.ts').gatherContext
  getAnalytics: typeof import('../hyphae/analytics.ts').getAnalytics
  getLessons: typeof import('../hyphae/lessons.ts').getLessons
  getSessionTimeline: typeof import('../hyphae/sessions.ts').getSessionTimeline
  getSessions: typeof import('../hyphae/sessions.ts').getSessions
}

const testDir = dirname(fileURLToPath(import.meta.url))
const hyphaeRoot = resolve(testDir, '../../../hyphae')
const hyphaeTarget = join(hyphaeRoot, 'target', 'debug', process.platform === 'win32' ? 'hyphae.exe' : 'hyphae')

let consumers: ContractConsumers
let tmpRoot = ''
let configPath = ''
let projectRoot = ''
const previousHyphaeConfig = process.env.HYPHAE_CONFIG

function runHyphae(args: string[]): string {
  return execFileSync(hyphaeBin, args, {
    cwd: hyphaeRoot,
    encoding: 'utf8',
    env: { ...process.env, HYPHAE_CONFIG: configPath, NO_COLOR: '1' },
    timeout: 10_000,
  }).trim()
}

function seedFixture() {
  runHyphae([
    '--project',
    'cap-contract',
    'store',
    '--topic',
    'corrections',
    '--content',
    'Use the owned Hyphae CLI contract for dashboard reads.',
    '--importance',
    'high',
  ])
  runHyphae([
    '--project',
    'cap-contract',
    'store',
    '--topic',
    'corrections',
    '--content',
    'Use the owned Hyphae CLI contract for dashboard reads.',
    '--importance',
    'high',
  ])
  runHyphae([
    '--project',
    'cap-contract',
    'store',
    '--topic',
    'errors/resolved',
    '--content',
    'Fixed the analytics argv to use the owned command shape.',
    '--importance',
    'medium',
  ])
  runHyphae([
    '--project',
    'cap-contract',
    'store',
    '--topic',
    'tests/resolved',
    '--content',
    'Added a real Cap to Hyphae contract test.',
    '--importance',
    'medium',
  ])
  runHyphae([
    '--project',
    'cap-contract',
    'store',
    '--topic',
    'decisions/api',
    '--content',
    'Cap should consume owned Hyphae surfaces instead of private storage.',
    '--importance',
    'critical',
  ])

  const sessionId = runHyphae([
    'session',
    'start',
    '--project',
    'cap-contract',
    '--task',
    'Validate the live Cap to Hyphae contract',
    '--project-root',
    projectRoot,
    '--worktree-id',
    'wt-contract',
    '--scope',
    'worker-a',
  ])

  runHyphae([
    'session',
    'end',
    '--id',
    sessionId,
    '--summary',
    'Validated analytics, lessons, context, sessions, and timeline surfaces.',
    '--file',
    'cap/server/hyphae/analytics.ts',
    '--errors',
    '0',
  ])
}

describe.sequential('Cap to Hyphae live contract', () => {
  beforeAll(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'cap-hyphae-contract-'))
    const dbPath = join(tmpRoot, 'hyphae.db')
    configPath = join(tmpRoot, 'config.toml')
    projectRoot = join(tmpRoot, 'repo')
    mkdirSync(projectRoot, { recursive: true })
    writeFileSync(configPath, `[store]\npath = ${JSON.stringify(dbPath)}\n`, 'utf8')

    execFileSync('cargo', ['build', '--quiet', '--bin', 'hyphae'], {
      cwd: hyphaeRoot,
      env: { ...process.env, NO_COLOR: '1' },
      stdio: 'pipe',
      timeout: 120_000,
    })

    hyphaeBin = hyphaeTarget
    process.env.HYPHAE_CONFIG = configPath
    seedFixture()

    vi.resetModules()
    const [analyticsModule, contextModule, lessonsModule, sessionsModule] = await Promise.all([
      import('../hyphae/analytics.ts'),
      import('../hyphae/context.ts'),
      import('../hyphae/lessons.ts'),
      import('../hyphae/sessions.ts'),
    ])

    consumers = {
      gatherContext: contextModule.gatherContext,
      getAnalytics: analyticsModule.getAnalytics,
      getLessons: lessonsModule.getLessons,
      getSessions: sessionsModule.getSessions,
      getSessionTimeline: sessionsModule.getSessionTimeline,
    }
  }, 180_000)

  afterAll(() => {
    if (previousHyphaeConfig === undefined) {
      delete process.env.HYPHAE_CONFIG
    } else {
      process.env.HYPHAE_CONFIG = previousHyphaeConfig
    }

    if (tmpRoot) {
      rmSync(tmpRoot, { force: true, recursive: true })
    }
  })

  it('loads analytics from the real hyphae binary', async () => {
    const analytics = await consumers.getAnalytics()

    expect(analytics.memory_utilization.total).toBeGreaterThanOrEqual(5)
    expect(analytics.importance_distribution.critical).toBeGreaterThanOrEqual(1)
    expect(analytics.top_topics.some((topic) => topic.name === 'corrections')).toBe(true)
  })

  it('loads lessons from the real hyphae binary', async () => {
    const lessons = await consumers.getLessons()

    expect(lessons.length).toBeGreaterThanOrEqual(3)
    expect(lessons[0]?.frequency).toBeGreaterThanOrEqual(1)
    expect(lessons.some((lesson) => lesson.category === 'corrections')).toBe(true)
    expect(lessons.some((lesson) => lesson.category === 'errors')).toBe(true)
    expect(lessons.some((lesson) => lesson.category === 'tests')).toBe(true)
  })

  it('loads context with identity-v1 filters from the real hyphae binary', async () => {
    const result = await consumers.gatherContext('Validate the live contract', {
      budget: 1500,
      include: 'memories,sessions',
      project: 'cap-contract',
      projectRoot,
      scope: 'worker-a',
      worktreeId: 'wt-contract',
    })

    expect(result.tokens_budget).toBe(1500)
    expect(result.sources_queried.length).toBeGreaterThanOrEqual(1)
    expect(result.context.length).toBeGreaterThanOrEqual(1)
  })

  it('loads session records with identity-v1 fields from the real hyphae binary', async () => {
    const sessions = await consumers.getSessions(
      {
        project: 'cap-contract',
        projectRoot,
        scope: 'worker-a',
        worktreeId: 'wt-contract',
      },
      10
    )

    expect(sessions.length).toBe(1)
    expect(sessions[0]).toMatchObject({
      project: 'cap-contract',
      project_root: projectRoot,
      scope: 'worker-a',
      status: 'completed',
      worktree_id: 'wt-contract',
    })
  })

  it('loads session timeline records from the real hyphae binary', async () => {
    const timeline = await consumers.getSessionTimeline(
      {
        project: 'cap-contract',
        projectRoot,
        scope: 'worker-a',
        worktreeId: 'wt-contract',
      },
      10
    )

    expect(timeline.length).toBe(1)
    expect(timeline[0]).toMatchObject({
      project: 'cap-contract',
      project_root: projectRoot,
      scope: 'worker-a',
      worktree_id: 'wt-contract',
    })
    expect(Array.isArray(timeline[0]?.events)).toBe(true)
  })
})
