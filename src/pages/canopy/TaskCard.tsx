import { Badge, Button, Group, Stack, Text } from '@mantine/core'

import type {
  CanopyOperatorAction,
  CanopyTask,
  CanopyTaskAttention,
  CanopyTaskHeartbeatSummary,
  CanopyTaskOwnershipSummary,
} from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { timeAgo } from '../../lib/time'
import {
  attentionColor,
  attentionSummaryLabel,
  freshnessColor,
  joinedReasons,
  operatorActionLabel,
  priorityColor,
  severityColor,
  statusColor,
  verificationColor,
} from './canopy-formatters'

export function TaskStatusBadge({ task }: { task: CanopyTask }) {
  return (
    <Group gap='xs'>
      <Badge
        color={statusColor(task.status)}
        variant='light'
      >
        {task.status}
      </Badge>
      <Badge
        color={verificationColor(task.verification_state)}
        variant='outline'
      >
        verify {task.verification_state}
      </Badge>
    </Group>
  )
}

export function TaskCard({
  actions,
  attention,
  heartbeatSummary,
  onOpen,
  ownership,
  task,
}: {
  actions: CanopyOperatorAction[]
  attention?: CanopyTaskAttention
  heartbeatSummary?: CanopyTaskHeartbeatSummary
  onOpen: (taskId: string) => void
  ownership?: CanopyTaskOwnershipSummary
  task: CanopyTask
}) {
  return (
    <SectionCard title={task.title}>
      <Stack gap='sm'>
        <Group justify='space-between'>
          <TaskStatusBadge task={task} />
          {attention ? (
            <Group gap='xs'>
              <Badge
                color={attentionColor(attention.level)}
                variant='light'
              >
                {attentionSummaryLabel(attention.level)}
              </Badge>
              <Badge
                color={freshnessColor(attention.freshness)}
                variant='outline'
              >
                {attention.freshness}
              </Badge>
            </Group>
          ) : null}
        </Group>
        {task.description ? <Text size='sm'>{task.description}</Text> : null}
        <Group gap='xs'>
          <Text
            c='dimmed'
            size='sm'
          >
            Requested by {task.requested_by}
          </Text>
          {task.owner_agent_id ? (
            <Text
              c='dimmed'
              size='sm'
            >
              Owner {task.owner_agent_id}
            </Text>
          ) : null}
        </Group>
        <Group gap='xs'>
          <Badge
            color={priorityColor(task.priority)}
            variant='outline'
          >
            priority {task.priority}
          </Badge>
          <Badge
            color={severityColor(task.severity)}
            variant='outline'
          >
            severity {task.severity}
          </Badge>
          <Badge
            color={attention?.acknowledged ? 'green' : 'gray'}
            variant='light'
          >
            {attention?.acknowledged ? 'acknowledged' : 'unacknowledged'}
          </Badge>
        </Group>
        {task.owner_note ? (
          <Text
            c='dimmed'
            size='sm'
          >
            Operator note: {task.owner_note}
          </Text>
        ) : null}
        {task.blocked_reason ? (
          <Text
            c='red'
            size='sm'
          >
            Blocked: {task.blocked_reason}
          </Text>
        ) : null}
        {task.closure_summary ? (
          <Text
            c='dimmed'
            size='sm'
          >
            Closure: {task.closure_summary}
          </Text>
        ) : null}
        {attention?.reasons.length ? (
          <Text
            c='dimmed'
            size='sm'
          >
            Attention: {joinedReasons(attention.reasons)}
          </Text>
        ) : null}
        {attention?.owner_heartbeat_freshness ? (
          <Text
            c='dimmed'
            size='sm'
          >
            Owner heartbeat: {attention.owner_heartbeat_freshness.replaceAll('_', ' ')}
          </Text>
        ) : null}
        {attention?.open_handoff_freshness ? (
          <Text
            c='dimmed'
            size='sm'
          >
            Open handoff: {attention.open_handoff_freshness.replaceAll('_', ' ')}
          </Text>
        ) : null}
        {ownership ? (
          <Text
            c='dimmed'
            size='sm'
          >
            Assignments {ownership.assignment_count} · reassignments {ownership.reassignment_count}
            {ownership.last_assigned_at ? ` · last assigned ${timeAgo(ownership.last_assigned_at, { allowMonths: true })}` : ''}
          </Text>
        ) : null}
        {heartbeatSummary ? (
          <Text
            c='dimmed'
            size='sm'
          >
            Heartbeats {heartbeatSummary.heartbeat_count} · agents {heartbeatSummary.related_agent_count}
            {heartbeatSummary.last_heartbeat_at ? ` · latest ${timeAgo(heartbeatSummary.last_heartbeat_at, { allowMonths: true })}` : ''}
          </Text>
        ) : null}
        {actions.length > 0 ? (
          <Group gap='xs'>
            {actions.slice(0, 2).map((action) => (
              <Badge
                color={attentionColor(action.level)}
                key={action.action_id}
                variant='outline'
              >
                {operatorActionLabel(action.kind)}
              </Badge>
            ))}
            {actions.length > 2 ? (
              <Badge
                color='gray'
                variant='light'
              >
                +{actions.length - 2} more
              </Badge>
            ) : null}
          </Group>
        ) : null}
        <Group justify='space-between'>
          <Stack gap={2}>
            <Text
              c='dimmed'
              size='xs'
            >
              {task.project_root}
            </Text>
            <Text
              c='dimmed'
              size='xs'
            >
              Updated {timeAgo(task.updated_at, { allowMonths: true })}
            </Text>
          </Stack>
          <Button
            onClick={() => onOpen(task.task_id)}
            size='xs'
            variant='light'
          >
            Open task detail
          </Button>
        </Group>
      </Stack>
    </SectionCard>
  )
}
