import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { loadCodexNotifyStatus } from '../lib/agent-runtimes.ts'

const tempDirs: string[] = []

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir) {
      rmSync(dir, { force: true, recursive: true })
    }
  }
})

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

describe('Codex notify runtime detection', () => {
  it('detects the expected hyphae notify contract', () => {
    const root = makeTempDir('cap-codex-notify-')
    const configPath = join(root, 'config.toml')
    writeFileSync(configPath, ['model = "gpt-5.4"', 'notify = ["hyphae", "codex-notify"]'].join('\n'), 'utf8')

    expect(loadCodexNotifyStatus(configPath)).toEqual({
      command: 'hyphae codex-notify',
      config_path: configPath,
      configured: true,
      contract_matched: true,
    })
  })

  it('flags a mismatched Codex notify contract without hiding it', () => {
    const root = makeTempDir('cap-codex-notify-mismatch-')
    const configPath = join(root, 'config.toml')
    writeFileSync(configPath, ['notify = ["hyphae", "something-else"]'].join('\n'), 'utf8')

    expect(loadCodexNotifyStatus(configPath)).toEqual({
      command: 'hyphae something-else',
      config_path: configPath,
      configured: true,
      contract_matched: false,
    })
  })
})
