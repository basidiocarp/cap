import { describe, expect, it } from 'vitest'

import { appConfigPath, appDataPath, claudeSettingsPath, codexConfigPath, findCommandPath, isCommandAvailable } from '../lib/platform'

describe('platform helpers', () => {
  it('builds app config and data paths with the expected file name', () => {
    expect(appConfigPath('hyphae')).toMatch(/hyphae[\\/]+config\.toml$/)
    expect(appDataPath('hyphae', 'hyphae.db')).toMatch(/hyphae[\\/]+hyphae\.db$/)
  })

  it('builds host-specific config paths', () => {
    expect(claudeSettingsPath()).toMatch(/[\\/]\.claude[\\/]settings\.json$/)
    expect(codexConfigPath()).toMatch(/[\\/]\.codex[\\/]config\.toml$/)
  })

  it('finds absolute executables and reports missing binaries', () => {
    expect(findCommandPath(process.execPath)).toBe(process.execPath)
    expect(isCommandAvailable('__definitely_not_a_real_cap_binary__')).toBe(false)
  })
})
