import { Badge, Group, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../lib/api'
import { timeAgo } from '../../lib/time'
import {
  attentionColor,
  attentionSummaryLabel,
  formatLabel,
  freshnessColor,
  joinedReasons,
  priorityColor,
  severityColor,
} from './canopy-formatters'
import { TaskStatusBadge } from './TaskCard'

export function TaskOverviewSection({ detail }: { detail: CanopyTaskDetail }) {
  return (
    <Stack gap='xs'>
      <TaskStatusBadge task={detail.task} />
      <Text size='sm'>Task ID: {detail.task.task_id}</Text>
      <Group gap='xs'>
        <Badge
          color={attentionColor(detail.attention.level)}
          variant='light'
        >
          {attentionSummaryLabel(detail.attention.level)}
        </Badge>
        <Badge
          color={freshnessColor(detail.attention.freshness)}
          variant='outline'
        >
          {detail.attention.freshness}
        </Badge>
        <Text
          c='dimmed'
          size='sm'
        >
          Created {timeAgo(detail.task.created_at, { allowMonths: true })}
        </Text>
        <Text
          c='dimmed'
          size='sm'
        >
          Updated {timeAgo(detail.task.updated_at, { allowMonths: true })}
        </Text>
      </Group>
      <Group gap='xs'>
        <Badge
          color={priorityColor(detail.task.priority)}
          variant='outline'
        >
          priority {detail.task.priority}
        </Badge>
        <Badge
          color={severityColor(detail.task.severity)}
          variant='outline'
        >
          severity {detail.task.severity}
        </Badge>
        <Badge
          color={detail.attention.acknowledged ? 'green' : 'gray'}
          variant='light'
        >
          {detail.attention.acknowledged ? 'acknowledged' : 'unacknowledged'}
        </Badge>
      </Group>
      {detail.attention.reasons.length ? (
        <Text
          c='dimmed'
          size='sm'
        >
          Attention reasons: {joinedReasons(detail.attention.reasons)}
        </Text>
      ) : null}
      {detail.attention.owner_heartbeat_freshness ? (
        <Text
          c='dimmed'
          size='sm'
        >
          Owner heartbeat freshness: {formatLabel(detail.attention.owner_heartbeat_freshness)}
        </Text>
      ) : null}
      {detail.attention.open_handoff_freshness ? (
        <Text
          c='dimmed'
          size='sm'
        >
          Open handoff freshness: {formatLabel(detail.attention.open_handoff_freshness)}
        </Text>
      ) : null}
      {detail.task.owner_note ? <Text size='sm'>Operator note: {detail.task.owner_note}</Text> : null}
      {detail.task.acknowledged_at ? (
        <Text
          c='dimmed'
          size='sm'
        >
          Acknowledged by {detail.task.acknowledged_by ?? 'operator'} {timeAgo(detail.task.acknowledged_at, { allowMonths: true })}
        </Text>
      ) : null}
      {detail.task.description ? <Text size='sm'>{detail.task.description}</Text> : null}
      {detail.task.closure_summary ? <Text size='sm'>Closure summary: {detail.task.closure_summary}</Text> : null}
    </Stack>
  )
}
