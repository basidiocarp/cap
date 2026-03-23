import { describe, expect, it } from 'vitest'

import type { EcosystemStatus } from '../../src/lib/api'
import { buildOnboardingActions } from '../../src/lib/onboarding'
import { buildStipeArgs, parseStipeAction } from '../routes/settings'

function createMissingStatus(): EcosystemStatus {
  return {
    hyphae: { available: false, memories: 0, memoirs: 0, version: null },
    hooks: { error_count: 1, installed_hooks: [], recent_errors: [] },
    lsps: [],
    mycelium: { available: false, version: null },
    rhizome: { available: false, backend: null, languages: [] },
  }
}

describe('onboarding helpers', () => {
  it('builds onboarding actions from a missing ecosystem status', () => {
    const actions = buildOnboardingActions(createMissingStatus())
    const commands = actions.map((action) => action.command)

    expect(commands).toContain('stipe install --profile minimal')
    expect(commands).toContain('stipe doctor')
    expect(commands).toContain('stipe init')
    expect(commands).toContain('cargo install mycelium')
    expect(commands).toContain('cargo install hyphae')
    expect(commands).toContain('cargo install rhizome')
  })

  it('accepts only allowlisted stipe actions', () => {
    expect(parseStipeAction('doctor')).toBe('doctor')
    expect(parseStipeAction('install-claude-code')).toBe('install-claude-code')
    expect(parseStipeAction('rm -rf /')).toBeNull()
  })

  it('maps allowlisted stipe actions to fixed argument lists', () => {
    expect(buildStipeArgs('install-full-stack')).toEqual(['install', '--profile', 'full-stack'])
  })
})
