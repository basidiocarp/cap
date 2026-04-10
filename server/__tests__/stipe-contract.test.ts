import { describe, expect, it } from 'vitest'

import { parseStipeDoctorReport, parseStipeInitPlan } from '../routes/settings/shared.ts'

describe('Stipe contract parsers', () => {
  it('accepts versioned stipe doctor payloads', () => {
    const parsed = parseStipeDoctorReport(
      JSON.stringify({
        checks: [{ message: 'missing', name: 'hyphae database', passed: false, repair_actions: [] }],
        healthy: false,
        repair_actions: [],
        schema_version: '1.0',
        summary: '1 checks need attention.',
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('rejects unversioned stipe doctor payloads', () => {
    expect(() =>
      parseStipeDoctorReport(
        JSON.stringify({
          checks: [],
          healthy: false,
          repair_actions: [],
          summary: '1 checks need attention.',
        })
      )
    ).toThrow('Invalid stipe doctor payload')
  })

  it('accepts versioned stipe init plan payloads', () => {
    const parsed = parseStipeInitPlan(
      JSON.stringify({
        detected_clients: ['Codex CLI'],
        detected_hosts: ['Codex CLI'],
        dry_run: true,
        repair_actions: [],
        schema_version: '1.0',
        selected_hosts: ['Codex CLI'],
        steps: [{ detail: 'Wire Hyphae into the selected host.', status: 'planned', title: 'Register the hyphae MCP server' }],
        target_client: 'codex',
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('rejects unversioned stipe init plan payloads', () => {
    expect(() =>
      parseStipeInitPlan(
        JSON.stringify({
          detected_clients: [],
          detected_hosts: [],
          dry_run: true,
          repair_actions: [],
          selected_hosts: [],
          steps: [],
        })
      )
    ).toThrow('Invalid stipe init plan payload')
  })
})
