import { Divider, Modal, ScrollArea, Stack } from '@mantine/core'

import type { CanopyTaskDetail } from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { TaskActivitySections } from './TaskActivitySections'
import { TaskOverviewSection } from './TaskOverviewSection'
import { TaskRuntimeSummaryGrid } from './TaskRuntimeSummaryGrid'
import { useTaskDetailMaps } from './task-detail-maps'

export function TaskDetailModal({
  detail,
  error,
  opened,
  onClose,
}: {
  detail: CanopyTaskDetail | undefined
  error: Error | null
  opened: boolean
  onClose: () => void
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

            <Divider label='Runtime Summary' />
            <TaskRuntimeSummaryGrid detail={detail} />

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
