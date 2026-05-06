import type { CanopyTaskDetail } from '../../lib/api'
import { TaskAgentAttentionSection } from './activity/TaskAgentAttentionSection'
import { TaskAssignmentsSection } from './activity/TaskAssignmentsSection'
import { TaskCouncilSection } from './activity/TaskCouncilSection'
import { TaskDiffReviewSection } from './activity/TaskDiffReviewSection'
import { TaskEvidenceSection } from './activity/TaskEvidenceSection'
import { TaskHandoffsSection } from './activity/TaskHandoffsSection'
import { TaskHeartbeatsSection } from './activity/TaskHeartbeatsSection'
import { TaskTimelineSection } from './activity/TaskTimelineSection'

export function TaskActivitySections({
  agentHeartbeatSummaryById,
  detail,
  handoffAttentionById,
}: {
  agentHeartbeatSummaryById: Map<string, CanopyTaskDetail['agent_heartbeat_summaries'][number]>
  detail: CanopyTaskDetail
  handoffAttentionById: Map<string, CanopyTaskDetail['handoff_attention'][number]>
}) {
  return (
    <>
      <TaskTimelineSection events={detail.events} />
      <TaskHeartbeatsSection heartbeats={detail.heartbeats} />
      <TaskAgentAttentionSection
        agentAttention={detail.agent_attention}
        agentHeartbeatSummaryById={agentHeartbeatSummaryById}
      />
      <TaskAssignmentsSection assignments={detail.assignments} />
      <TaskHandoffsSection
        handoffAttentionById={handoffAttentionById}
        handoffs={detail.handoffs}
      />
      <TaskCouncilSection detail={detail} />
      <TaskEvidenceSection evidence={detail.evidence} />
      <TaskDiffReviewSection taskId={detail.task.task_id} />
    </>
  )
}
