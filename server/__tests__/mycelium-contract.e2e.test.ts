import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const cargoAvailable = spawnSync('cargo', ['--version'], { stdio: 'pipe' }).status === 0

let myceliumBin = 'mycelium'

vi.mock('../lib/config.ts', async () => {
  const actual = await vi.importActual<typeof import('../lib/config.ts')>('../lib/config.ts')
  return { ...actual, MYCELIUM_BIN: myceliumBin }
})

interface ContractConsumers {
  getAnalytics: typeof import('../mycelium/analytics.ts').getAnalytics
  getCommandHistory: typeof import('../mycelium/history.ts').getCommandHistory
}

const testDir = dirname(fileURLToPath(import.meta.url))
const myceliumRoot = resolve(testDir, '../../../mycelium')
const myceliumTarget = join(myceliumRoot, 'target', 'debug', process.platform === 'win32' ? 'mycelium.exe' : 'mycelium')

let consumers: ContractConsumers
let dbPath = ''
let projectRoot = ''
let canonicalProjectRoot = ''
let tmpRoot = ''
const runtimeSessionId = 'claude-session-contract-42'
const previousMyceliumDbPath = process.env.MYCELIUM_DB_PATH
const previousMyceliumProjectPath = process.env.MYCELIUM_PROJECT_PATH

function runMycelium(args: string[]): string {
  return execFileSync(myceliumBin, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_SESSION_ID: runtimeSessionId,
      MYCELIUM_DB_PATH: dbPath,
      MYCELIUM_PROJECT_PATH: projectRoot,
      NO_COLOR: '1',
    },
    timeout: 10_000,
  }).trim()
}

function seedFixture() {
  mkdirSync(join(projectRoot, 'src'), { recursive: true })
  const readmeLines = Array.from(
    { length: 260 },
    (_, index) => `README line ${index + 1}: contract fixture content that should force tracked filtering.`
  )
  const rustLines = ['pub fn add(left: i32, right: i32) -> i32 {', '    left + right', '}', '']
  rustLines.push(
    ...Array.from({ length: 260 }, (_, index) => `// filler line ${index + 1}: this keeps the example file above the tracking threshold.`)
  )
  writeFileSync(
    join(projectRoot, 'README.md'),
    ['# Contract Fixture', '', 'This repository exists to exercise the Cap to Mycelium CLI contract.', ...readmeLines].join('\n'),
    'utf8'
  )
  writeFileSync(join(projectRoot, 'src', 'example.rs'), rustLines.join('\n'), 'utf8')

  runMycelium(['read', 'README.md'])
  runMycelium(['read', 'src/example.rs'])
  runMycelium(['env'])
}

describe.runIf(cargoAvailable).sequential('Cap to Mycelium live contract', () => {
  beforeAll(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'cap-mycelium-contract-'))
    dbPath = join(tmpRoot, 'history.db')
    projectRoot = join(tmpRoot, 'repo')
    mkdirSync(projectRoot, { recursive: true })
    canonicalProjectRoot = realpathSync(projectRoot)

    execFileSync('cargo', ['build', '--quiet', '--bin', 'mycelium'], {
      cwd: myceliumRoot,
      env: { ...process.env, NO_COLOR: '1' },
      stdio: 'pipe',
      timeout: 180_000,
    })

    myceliumBin = myceliumTarget
    process.env.MYCELIUM_DB_PATH = dbPath
    process.env.MYCELIUM_PROJECT_PATH = canonicalProjectRoot
    seedFixture()

    vi.resetModules()
    const [analyticsModule, historyModule] = await Promise.all([import('../mycelium/analytics.ts'), import('../mycelium/history.ts')])

    consumers = {
      getAnalytics: analyticsModule.getAnalytics,
      getCommandHistory: historyModule.getCommandHistory,
    }
  }, 240_000)

  afterAll(() => {
    if (previousMyceliumDbPath === undefined) {
      delete process.env.MYCELIUM_DB_PATH
    } else {
      process.env.MYCELIUM_DB_PATH = previousMyceliumDbPath
    }

    if (previousMyceliumProjectPath === undefined) {
      delete process.env.MYCELIUM_PROJECT_PATH
    } else {
      process.env.MYCELIUM_PROJECT_PATH = previousMyceliumProjectPath
    }

    if (tmpRoot) {
      rmSync(tmpRoot, { force: true, recursive: true })
    }
  })

  it('loads analytics from the real mycelium binary', async () => {
    const analytics = await consumers.getAnalytics()

    expect(analytics).not.toBeNull()
    expect(analytics?.total_stats.total_commands).toBeGreaterThanOrEqual(3)
    expect(analytics?.top_commands.length).toBeGreaterThanOrEqual(1)
    expect(analytics?.top_commands.some((entry) => entry.command.startsWith('mycelium'))).toBe(true)
  })

  it('loads command history from the real mycelium binary with project filtering and limit', async () => {
    const history = await consumers.getCommandHistory(2, canonicalProjectRoot)

    expect(history.total).toBeGreaterThanOrEqual(3)
    expect(history.commands).toHaveLength(2)
    expect(history.commands.every((entry) => entry.project_path === canonicalProjectRoot)).toBe(true)
    expect(history.commands.every((entry) => entry.command.startsWith('mycelium'))).toBe(true)
    expect(history.commands.every((entry) => entry.session_id === runtimeSessionId)).toBe(true)
  })
})
