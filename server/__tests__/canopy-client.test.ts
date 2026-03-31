import { beforeEach, describe, expect, it, vi } from 'vitest'

const runCliMock = vi.fn()

vi.mock('../lib/cli.ts', () => ({
  createCliRunner: vi.fn(() => runCliMock),
}))

vi.mock('../lib/config.ts', () => ({
  CANOPY_BIN: 'canopy-test',
}))

describe('Canopy CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('accepts snapshot payloads with versioned evidence refs', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        evidence: [
          {
            evidence_id: '01KMSCANOPYEVIDENCE00000001',
            label: 'Operator note',
            related_file: null,
            related_handoff_id: null,
            related_memory_query: null,
            related_session_id: null,
            related_symbol: null,
            schema_version: '1.0',
            source_kind: 'manual_note',
            source_ref: 'note-1',
            summary: null,
            task_id: '01KMSCANOPYTASK0000000001',
          },
        ],
        tasks: [],
      })
    )

    const { getSnapshot } = await import('../canopy.ts')
    await expect(getSnapshot()).resolves.toMatchObject({
      evidence: [
        {
          evidence_id: '01KMSCANOPYEVIDENCE00000001',
          schema_version: '1.0',
        },
      ],
    })
  })

  it('rejects snapshot payloads with unversioned evidence refs', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        evidence: [
          {
            evidence_id: '01KMSCANOPYEVIDENCE00000001',
            label: 'Operator note',
            related_file: null,
            related_handoff_id: null,
            related_memory_query: null,
            related_session_id: null,
            related_symbol: null,
            source_kind: 'manual_note',
            source_ref: 'note-1',
            summary: null,
            task_id: '01KMSCANOPYTASK0000000001',
          },
        ],
        tasks: [],
      })
    )

    const { getSnapshot } = await import('../canopy.ts')
    await expect(getSnapshot()).rejects.toThrow('Invalid evidence payload from canopy api snapshot')
  })

  it('rejects snapshot payloads with a missing top-level schema version', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ evidence: [], tasks: [] }))

    const { getSnapshot } = await import('../canopy.ts')
    await expect(getSnapshot()).rejects.toThrow('Invalid payload from canopy api snapshot')
  })

  it('rejects task detail payloads with an unsupported evidence schema version', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        allowed_actions: [],
        task: { task_id: 'task-1' },
        evidence: [
          {
            evidence_id: '01KMSCANOPYEVIDENCE00000001',
            label: 'Operator note',
            related_file: null,
            related_handoff_id: null,
            related_memory_query: null,
            related_session_id: null,
            related_symbol: null,
            schema_version: '2.0',
            source_kind: 'manual_note',
            source_ref: 'note-1',
            summary: null,
            task_id: '01KMSCANOPYTASK0000000001',
          },
        ],
      })
    )

    const { getTaskDetail } = await import('../canopy.ts')
    await expect(getTaskDetail('task-1')).rejects.toThrow('Invalid evidence payload from canopy api task')
  })

  it('rejects task detail payloads with a missing top-level schema version', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ allowed_actions: [], evidence: [], task: { task_id: 'task-1' } }))

    const { getTaskDetail } = await import('../canopy.ts')
    await expect(getTaskDetail('task-1')).rejects.toThrow('Invalid payload from canopy api task')
  })
})
