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

  it('accepts stipe doctor with null repair_action description', () => {
    const parsed = parseStipeDoctorReport(
      JSON.stringify({
        checks: [],
        healthy: true,
        repair_actions: [{ args: [], command: 'restart-server', description: null, label: 'Restart', tier: 'primary' }],
        schema_version: '1.0',
        summary: 'All checks pass.',
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('accepts stipe doctor with null repair_action description in nested check', () => {
    const parsed = parseStipeDoctorReport(
      JSON.stringify({
        checks: [
          {
            message: 'needs repair',
            name: 'test-check',
            passed: false,
            repair_actions: [{ args: [], command: 'fix', description: null, label: 'Fix', tier: 'secondary' }],
          },
        ],
        healthy: false,
        repair_actions: [],
        schema_version: '1.0',
        summary: 'Check failed.',
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('accepts stipe init plan with null step detail', () => {
    const parsed = parseStipeInitPlan(
      JSON.stringify({
        detected_clients: [],
        detected_hosts: [],
        dry_run: true,
        repair_actions: [],
        schema_version: '1.0',
        selected_hosts: [],
        steps: [{ detail: null, status: 'planned', title: 'Step title' }],
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('accepts stipe init plan with missing step detail', () => {
    const parsed = parseStipeInitPlan(
      JSON.stringify({
        detected_clients: [],
        detected_hosts: [],
        dry_run: true,
        repair_actions: [],
        schema_version: '1.0',
        selected_hosts: [],
        steps: [{ status: 'planned', title: 'Step title' }],
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('still accepts stipe doctor with string repair_action description', () => {
    const parsed = parseStipeDoctorReport(
      JSON.stringify({
        checks: [],
        healthy: true,
        repair_actions: [
          { args: [], command: 'restart-server', description: 'Restart the server gracefully', label: 'Restart', tier: 'primary' },
        ],
        schema_version: '1.0',
        summary: 'All checks pass.',
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('still accepts stipe init plan with string step detail', () => {
    const parsed = parseStipeInitPlan(
      JSON.stringify({
        detected_clients: [],
        detected_hosts: [],
        dry_run: true,
        repair_actions: [],
        schema_version: '1.0',
        selected_hosts: [],
        steps: [{ detail: 'Register the hyphae MCP server.', status: 'planned', title: 'Register' }],
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('accepts stipe init plan with minimal repair_action (action_key, command, label only)', () => {
    const parsed = parseStipeInitPlan(
      JSON.stringify({
        detected_clients: [],
        detected_hosts: [],
        dry_run: true,
        repair_actions: [{ action_key: 'install-hyphae', command: 'install', label: 'Install Hyphae' }],
        schema_version: '1.0',
        selected_hosts: [],
        steps: [],
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('accepts stipe init plan with full repair_action (action_key, command, label, args, tier, description)', () => {
    const parsed = parseStipeInitPlan(
      JSON.stringify({
        detected_clients: [],
        detected_hosts: [],
        dry_run: true,
        repair_actions: [
          {
            action_key: 'install-hyphae',
            args: ['--force'],
            command: 'install',
            description: 'Install the Hyphae memory system',
            label: 'Install Hyphae',
            tier: 'primary',
          },
        ],
        schema_version: '1.0',
        selected_hosts: [],
        steps: [],
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('rejects stipe init plan with repair_action missing action_key', () => {
    expect(() =>
      parseStipeInitPlan(
        JSON.stringify({
          detected_clients: [],
          detected_hosts: [],
          dry_run: true,
          repair_actions: [{ command: 'install', label: 'Install Hyphae' }],
          schema_version: '1.0',
          selected_hosts: [],
          steps: [],
        })
      )
    ).toThrow('Invalid stipe init plan payload')
  })

  it('accepts stipe init plan with repair_action where description is null', () => {
    const parsed = parseStipeInitPlan(
      JSON.stringify({
        detected_clients: [],
        detected_hosts: [],
        dry_run: true,
        repair_actions: [{ action_key: 'install-hyphae', command: 'install', description: null, label: 'Install Hyphae' }],
        schema_version: '1.0',
        selected_hosts: [],
        steps: [],
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })

  it('still accepts stipe doctor with full repair_action including tier', () => {
    const parsed = parseStipeDoctorReport(
      JSON.stringify({
        checks: [],
        healthy: true,
        repair_actions: [{ args: [], command: 'restart-server', description: 'Restart', label: 'Restart', tier: 'primary' }],
        schema_version: '1.0',
        summary: 'All checks pass.',
      })
    ) as Record<string, unknown>

    expect(parsed.schema_version).toBe('1.0')
  })
})
