import { Badge, Grid, Group, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { SectionCard } from '../../components/SectionCard'
import { timeAgo } from '../../lib/time'
import { attentionColor, operatorActionLabel } from './canopy-formatters'

export function TaskRuntimeSummaryGrid({ detail }: { detail: CanopyTaskDetail }) {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <SectionCard title='Ownership'>
          <Stack gap={4}>
            <Text size='sm'>Current owner: {detail.ownership.current_owner_agent_id ?? 'unassigned'}</Text>
            <Text size='sm'>Assignments: {detail.ownership.assignment_count}</Text>
            <Text size='sm'>Reassignments: {detail.ownership.reassignment_count}</Text>
            {detail.ownership.last_assigned_to ? (
              <Text
                c='dimmed'
                size='sm'
              >
                Last assigned to {detail.ownership.last_assigned_to}
                {detail.ownership.last_assigned_at ? ` ${timeAgo(detail.ownership.last_assigned_at, { allowMonths: true })}` : ''}
              </Text>
            ) : null}
            {detail.ownership.last_assignment_reason ? (
              <Text
                c='dimmed'
                size='sm'
              >
                Reason: {detail.ownership.last_assignment_reason}
              </Text>
            ) : null}
          </Stack>
        </SectionCard>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <SectionCard title='Heartbeat Summary'>
          <Stack gap={4}>
            <Text size='sm'>Heartbeats: {detail.heartbeat_summary.heartbeat_count}</Text>
            <Text size='sm'>Agents: {detail.heartbeat_summary.related_agent_count}</Text>
            <Text size='sm'>
              Freshness: {detail.heartbeat_summary.fresh_agents} fresh · {detail.heartbeat_summary.aging_agents} aging ·{' '}
              {detail.heartbeat_summary.stale_agents} stale · {detail.heartbeat_summary.missing_agents} missing
            </Text>
            {detail.heartbeat_summary.last_heartbeat_at ? (
              <Text
                c='dimmed'
                size='sm'
              >
                Latest {timeAgo(detail.heartbeat_summary.last_heartbeat_at, { allowMonths: true })}
              </Text>
            ) : null}
          </Stack>
        </SectionCard>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <SectionCard title='Execution Summary'>
          <Stack gap={4}>
            <Text size='sm'>Claims: {detail.execution_summary.claim_count}</Text>
            <Text size='sm'>
              Runs: {detail.execution_summary.run_count} · pauses {detail.execution_summary.pause_count} · yields{' '}
              {detail.execution_summary.yield_count}
            </Text>
            <Text size='sm'>
              Completions: {detail.execution_summary.completion_count} · total {detail.execution_summary.total_execution_seconds}s
            </Text>
            {detail.execution_summary.active_execution_seconds > 0 ? (
              <Text size='sm'>Active execution: {detail.execution_summary.active_execution_seconds}s</Text>
            ) : null}
            {detail.execution_summary.last_execution_action === 'claim_task' && detail.execution_summary.run_count === 0 ? (
              <Text size='sm'>Execution state: claimed and ready to start</Text>
            ) : null}
            {detail.execution_summary.last_execution_action === 'pause_task' ? (
              <Text size='sm'>Execution state: paused and resumable</Text>
            ) : null}
            {detail.execution_summary.last_execution_action ? (
              <Text
                c='dimmed'
                size='sm'
              >
                Last {detail.execution_summary.last_execution_action.replaceAll('_', ' ')}
                {detail.execution_summary.last_execution_at
                  ? ` ${timeAgo(detail.execution_summary.last_execution_at, { allowMonths: true })}`
                  : ''}
                {detail.execution_summary.last_execution_agent_id ? ` by ${detail.execution_summary.last_execution_agent_id}` : ''}
              </Text>
            ) : (
              <Text
                c='dimmed'
                size='sm'
              >
                No execution events recorded yet.
              </Text>
            )}
          </Stack>
        </SectionCard>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <SectionCard title='Operator Actions'>
          {detail.operator_actions.length > 0 ? (
            <Stack gap='xs'>
              {detail.operator_actions.map((action) => (
                <Stack
                  gap={4}
                  key={action.action_id}
                >
                  <Group gap='xs'>
                    <Badge
                      color={attentionColor(action.level)}
                      size='xs'
                      variant='light'
                    >
                      {operatorActionLabel(action.kind)}
                    </Badge>
                    <Badge
                      color='gray'
                      size='xs'
                      variant='outline'
                    >
                      {action.target_kind}
                    </Badge>
                  </Group>
                  <Text size='sm'>{action.title}</Text>
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    {action.summary}
                  </Text>
                </Stack>
              ))}
            </Stack>
          ) : (
            <EmptyState>No runtime actions suggested for this task.</EmptyState>
          )}
        </SectionCard>
      </Grid.Col>
    </Grid>
  )
}
