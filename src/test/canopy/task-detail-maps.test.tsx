import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CanopyTaskDetail } from '../../lib/api'
import { useTaskDetailMaps } from '../../pages/canopy/task-detail-maps'

describe('useTaskDetailMaps', () => {
  it('indexes handoff attention and heartbeat summaries by id', () => {
    const detail = {
      agent_heartbeat_summaries: [
        {
          agent_id: 'agent-1',
          last_heartbeat_at: '2026-03-28T10:00:00Z',
          latest_task_id: 'task-1',
          missing: false,
          stale: false,
        },
      ],
      handoff_attention: [
        {
          due_at: '2026-03-28T11:00:00Z',
          expired: false,
          expires_at: null,
          handoff_id: 'handoff-1',
          overdue: false,
          task_id: 'task-1',
        },
      ],
    } as unknown as CanopyTaskDetail

    const { result } = renderHook(() => useTaskDetailMaps(detail))

    expect(result.current.handoffAttentionById.get('handoff-1')).toMatchObject({
      task_id: 'task-1',
    })
    expect(result.current.agentHeartbeatSummaryById.get('agent-1')).toMatchObject({
      latest_task_id: 'task-1',
    })
  })

  it('returns empty maps when detail is missing', () => {
    const { result } = renderHook(() => useTaskDetailMaps(undefined))

    expect(result.current.handoffAttentionById.size).toBe(0)
    expect(result.current.agentHeartbeatSummaryById.size).toBe(0)
  })
})
