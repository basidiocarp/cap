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

  // Minimal snapshot scaffolding with all post-F2.6 required fields.
  const baseSnapshot = {
    attention: {},
    drift_signals: { evidence_gap_hours: null, high_correction_rate: false, test_failure_streak: 0 },
    evidence: [],
    schema_version: '1.0',
    sla_summary: {},
    tasks: [],
  }

  // Minimal task-detail scaffolding with all post-F2.7 required fields.
  const baseTaskDetail = {
    allowed_actions: [],
    attention: {},
    evidence: [],
    schema_version: '1.0',
    sla_summary: {},
    task: { task_id: 'task-1' },
  }

  it('accepts snapshot payloads with versioned evidence refs', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        ...baseSnapshot,
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
        ...baseSnapshot,
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
      })
    )

    const { getSnapshot } = await import('../canopy.ts')
    await expect(getSnapshot()).rejects.toThrow('Invalid evidence payload from canopy api snapshot')
  })

  it('rejects snapshot payloads with a missing top-level schema version', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ ...baseSnapshot, schema_version: undefined }))

    const { getSnapshot } = await import('../canopy.ts')
    await expect(getSnapshot()).rejects.toThrow('Invalid payload from canopy api snapshot')
  })

  it('rejects snapshot payloads missing attention (F2.6)', async () => {
    const { attention, ...rest } = baseSnapshot
    void attention
    runCliMock.mockResolvedValue(JSON.stringify(rest))

    const { getSnapshot } = await import('../canopy.ts')
    await expect(getSnapshot()).rejects.toThrow('Invalid payload from canopy api snapshot')
  })

  it('rejects snapshot payloads missing sla_summary (F2.6)', async () => {
    const { sla_summary, ...rest } = baseSnapshot
    void sla_summary
    runCliMock.mockResolvedValue(JSON.stringify(rest))

    const { getSnapshot } = await import('../canopy.ts')
    await expect(getSnapshot()).rejects.toThrow('Invalid payload from canopy api snapshot')
  })

  it('rejects snapshot payloads missing drift_signals (F2.6)', async () => {
    const { drift_signals, ...rest } = baseSnapshot
    void drift_signals
    runCliMock.mockResolvedValue(JSON.stringify(rest))

    const { getSnapshot } = await import('../canopy.ts')
    await expect(getSnapshot()).rejects.toThrow('Invalid payload from canopy api snapshot')
  })

  it('rejects task detail payloads with an unsupported evidence schema version', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        ...baseTaskDetail,
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
    runCliMock.mockResolvedValue(JSON.stringify({ ...baseTaskDetail, schema_version: undefined }))

    const { getTaskDetail } = await import('../canopy.ts')
    await expect(getTaskDetail('task-1')).rejects.toThrow('Invalid payload from canopy api task')
  })

  it('rejects task detail payloads missing attention (F2.7)', async () => {
    const { attention, ...rest } = baseTaskDetail
    void attention
    runCliMock.mockResolvedValue(JSON.stringify(rest))

    const { getTaskDetail } = await import('../canopy.ts')
    await expect(getTaskDetail('task-1')).rejects.toThrow('Invalid payload from canopy api task')
  })

  it('rejects task detail payloads missing sla_summary (F2.7)', async () => {
    const { sla_summary, ...rest } = baseTaskDetail
    void sla_summary
    runCliMock.mockResolvedValue(JSON.stringify(rest))

    const { getTaskDetail } = await import('../canopy.ts')
    await expect(getTaskDetail('task-1')).rejects.toThrow('Invalid payload from canopy api task')
  })
})
