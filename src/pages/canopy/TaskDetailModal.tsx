import { Divider, Modal, ScrollArea, Stack } from '@mantine/core'

import type { CanopyAgentRegistration, CanopyTaskDetail } from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { TaskActivitySections } from './TaskActivitySections'
import { TaskCoordinationActionsSection } from './TaskCoordinationActionsSection'
import { TaskOperatorActionsSection } from './TaskOperatorActionsSection'
import { TaskOverviewSection } from './TaskOverviewSection'
import { TaskRelatedTasksSection } from './TaskRelatedTasksSection'
import { TaskRuntimeSummaryGrid } from './TaskRuntimeSummaryGrid'
import { useTaskDetailMaps } from './task-detail-maps'

export function TaskDetailModal({
  agents,
  detail,
  error,
  opened,
  onClose,
  onOpenTask,
}: {
  agents: CanopyAgentRegistration[]
  detail: CanopyTaskDetail | undefined
  error: Error | null
  opened: boolean
  onClose: () => void
  onOpenTask: (taskId: string) => void
}) {
  const { agentHeartbeatSummaryById, handoffAttentionById } = useTaskDetailMaps(detail)

  return (
    <Modal
      centered
      onClose={onClose}
      opened={opened}
      size='xl'
      title={detail?.task.title ?? 'Task detail'}
    >
      {!detail ? (
        error ? (
          <Stack gap='md'>
            <ErrorAlert error={error} />
            <EmptyState>Could not load task detail for the selected Canopy task.</EmptyState>
          </Stack>
        ) : (
          <PageLoader mt='md' />
        )
      ) : (
        <ScrollArea.Autosize mah={560}>
          <Stack gap='md'>
            <TaskOverviewSection detail={detail} />

            <Divider label='Operator Actions' />
            <TaskOperatorActionsSection
              agents={agents}
              detail={detail}
            />

            <Divider label='Coordination Actions' />
            <TaskCoordinationActionsSection
              agents={agents}
              detail={detail}
            />

            <Divider label='Runtime Summary' />
            <TaskRuntimeSummaryGrid detail={detail} />

            {detail.related_tasks.length > 0 ? (
              <>
                <Divider label='Related Tasks' />
                <TaskRelatedTasksSection
                  onOpenTask={onOpenTask}
                  relatedTasks={detail.related_tasks}
                />
              </>
            ) : null}

            <TaskActivitySections
              agentHeartbeatSummaryById={agentHeartbeatSummaryById}
              detail={detail}
              handoffAttentionById={handoffAttentionById}
            />
          </Stack>
        </ScrollArea.Autosize>
      )}
    </Modal>
  )
}
