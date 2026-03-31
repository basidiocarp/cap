import { describe, expect, it } from 'vitest'

import { parseStipeDoctorReport, parseStipeInitPlan } from '../routes/settings/shared.ts'

describe('Stipe contract parsers', () => {
  it('accepts versioned stipe doctor payloads', () => {
    const parsed = parseStipeDoctorReport(
      JSON.stringify({
        schema_version: '1.0',
        healthy: false,
        summary: '1 checks need attention.',
        checks: [{ name: 'hyphae database', message: 'missing', passed: false, repair_actions: [] }],
        repair_actions: [],
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('rejects unversioned stipe doctor payloads', () => {
    expect(() =>
      parseStipeDoctorReport(
        JSON.stringify({
          healthy: false,
          summary: '1 checks need attention.',
          checks: [],
          repair_actions: [],
        })
      )
    ).toThrow('Invalid stipe doctor payload')
  })

  it('accepts versioned stipe init plan payloads', () => {
    const parsed = parseStipeInitPlan(
      JSON.stringify({
        schema_version: '1.0',
        dry_run: true,
        target_client: 'codex',
        selected_hosts: ['Codex CLI'],
        detected_hosts: ['Codex CLI'],
        detected_clients: ['Codex CLI'],
        steps: [{ title: 'Register the hyphae MCP server', detail: 'Wire Hyphae into the selected host.', status: 'planned' }],
        repair_actions: [],
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('rejects unversioned stipe init plan payloads', () => {
    expect(() =>
      parseStipeInitPlan(
        JSON.stringify({
          dry_run: true,
          selected_hosts: [],
          detected_hosts: [],
          detected_clients: [],
          steps: [],
          repair_actions: [],
        })
      )
    ).toThrow('Invalid stipe init plan payload')
  })
})
