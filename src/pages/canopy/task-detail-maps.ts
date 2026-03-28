import { useMemo } from 'react'

import type { CanopyTaskDetail } from '../../lib/api'

export function useTaskDetailMaps(detail: CanopyTaskDetail | undefined) {
  const handoffAttentionById = useMemo(
    () => new Map(detail?.handoff_attention.map((attention) => [attention.handoff_id, attention]) ?? []),
    [detail?.handoff_attention]
  )
  const agentHeartbeatSummaryById = useMemo(
    () => new Map(detail?.agent_heartbeat_summaries.map((summary) => [summary.agent_id, summary]) ?? []),
    [detail?.agent_heartbeat_summaries]
  )

  return { agentHeartbeatSummaryById, handoffAttentionById }
}
