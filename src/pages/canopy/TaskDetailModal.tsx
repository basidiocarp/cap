import { Badge, Button, Divider, Grid, Group, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import type { CanopyTaskDetail } from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { SectionCard } from '../../components/SectionCard'
import { timeAgo } from '../../lib/time'
import {
  attentionColor,
  attentionSummaryLabel,
  eventTitle,
  evidenceLinks,
  formatLabel,
  freshnessColor,
  heartbeatSourceLabel,
  joinedReasons,
  operatorActionLabel,
  priorityColor,
  severityColor,
  statusColor,
  verificationColor,
} from './canopy-formatters'
import { TaskStatusBadge } from './TaskCard'

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
  const handoffAttentionById = useMemo(
    () => new Map(detail?.handoff_attention.map((attention) => [attention.handoff_id, attention]) ?? []),
    [detail?.handoff_attention]
  )
  const agentHeartbeatSummaryById = useMemo(
    () => new Map(detail?.agent_heartbeat_summaries.map((summary) => [summary.agent_id, summary]) ?? []),
    [detail?.agent_heartbeat_summaries]
  )

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

            <Divider label='Runtime Summary' />
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

            <Divider label='Timeline' />
            {detail.events.length > 0 ? (
              <Stack gap='sm'>
                {detail.events.map((event) => (
                  <SectionCard
                    key={event.event_id}
                    p='sm'
                  >
                    <Stack gap={4}>
                      <Group justify='space-between'>
                        <Text fw={600}>{eventTitle(event)}</Text>
                        <Text
                          c='dimmed'
                          size='xs'
                        >
                          {timeAgo(event.created_at, { allowMonths: true })}
                        </Text>
                      </Group>
                      <Group gap='xs'>
                        <Badge
                          color={statusColor(event.to_status)}
                          size='xs'
                          variant='light'
                        >
                          {event.to_status}
                        </Badge>
                        {event.verification_state ? (
                          <Badge
                            color={verificationColor(event.verification_state)}
                            size='xs'
                            variant='outline'
                          >
                            {event.verification_state}
                          </Badge>
                        ) : null}
                      </Group>
                      <Text size='sm'>Actor: {event.actor}</Text>
                      {event.from_status ? (
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          From {event.from_status}
                        </Text>
                      ) : null}
                      {event.owner_agent_id ? (
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          Owner {event.owner_agent_id}
                        </Text>
                      ) : null}
                      {event.note ? <Text size='sm'>{event.note}</Text> : null}
                    </Stack>
                  </SectionCard>
                ))}
              </Stack>
            ) : (
              <EmptyState>No lifecycle events recorded for this task yet.</EmptyState>
            )}

            <Divider label='Heartbeats' />
            {detail.heartbeats.length > 0 ? (
              <Stack gap='xs'>
                {detail.heartbeats.map((heartbeat) => (
                  <SectionCard
                    key={heartbeat.heartbeat_id}
                    p='sm'
                  >
                    <Stack gap={4}>
                      <Group justify='space-between'>
                        <Group gap='xs'>
                          <Badge
                            color='blue'
                            size='xs'
                            variant='light'
                          >
                            {heartbeat.status}
                          </Badge>
                          <Badge
                            color='gray'
                            size='xs'
                            variant='outline'
                          >
                            {heartbeatSourceLabel(heartbeat.source)}
                          </Badge>
                        </Group>
                        <Text
                          c='dimmed'
                          size='xs'
                        >
                          {timeAgo(heartbeat.created_at, { allowMonths: true })}
                        </Text>
                      </Group>
                      <Text size='sm'>Agent: {heartbeat.agent_id}</Text>
                      {heartbeat.current_task_id ? (
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          Current task {heartbeat.current_task_id}
                        </Text>
                      ) : null}
                      {heartbeat.related_task_id ? (
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          Related task {heartbeat.related_task_id}
                        </Text>
                      ) : null}
                    </Stack>
                  </SectionCard>
                ))}
              </Stack>
            ) : (
              <EmptyState>No heartbeat history recorded for this task yet.</EmptyState>
            )}

            <Divider label='Agent Attention' />
            {detail.agent_attention.length > 0 ? (
              <Stack gap='xs'>
                {detail.agent_attention.map((attention) => (
                  <SectionCard
                    key={attention.agent_id}
                    p='sm'
                  >
                    <Stack gap={4}>
                      <Group justify='space-between'>
                        <Group gap='xs'>
                          <Badge
                            color={attentionColor(attention.level)}
                            size='xs'
                            variant='light'
                          >
                            {attentionSummaryLabel(attention.level)}
                          </Badge>
                          <Badge
                            color={freshnessColor(attention.freshness)}
                            size='xs'
                            variant='outline'
                          >
                            {attention.freshness}
                          </Badge>
                        </Group>
                        {attention.last_heartbeat_at ? (
                          <Text
                            c='dimmed'
                            size='xs'
                          >
                            {timeAgo(attention.last_heartbeat_at, { allowMonths: true })}
                          </Text>
                        ) : null}
                      </Group>
                      <Text size='sm'>Agent: {attention.agent_id}</Text>
                      {attention.current_task_id ? (
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          Current task {attention.current_task_id}
                        </Text>
                      ) : null}
                      {agentHeartbeatSummaryById.get(attention.agent_id) ? (
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          Heartbeats {agentHeartbeatSummaryById.get(attention.agent_id)?.heartbeat_count} · latest status{' '}
                          {agentHeartbeatSummaryById.get(attention.agent_id)?.last_status ?? 'unknown'}
                        </Text>
                      ) : null}
                      {attention.reasons.length ? (
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          Reasons: {joinedReasons(attention.reasons)}
                        </Text>
                      ) : null}
                    </Stack>
                  </SectionCard>
                ))}
              </Stack>
            ) : (
              <EmptyState>No agent attention summary for this task yet.</EmptyState>
            )}

            <Divider label='Assignments' />
            {detail.assignments.length > 0 ? (
              <Stack gap='xs'>
                {detail.assignments.map((assignment) => (
                  <SectionCard
                    key={assignment.assignment_id}
                    p='sm'
                  >
                    <Stack gap={4}>
                      <Text size='sm'>
                        {assignment.assigned_by} → {assignment.assigned_to}
                      </Text>
                      <Text
                        c='dimmed'
                        size='sm'
                      >
                        {timeAgo(assignment.assigned_at, { allowMonths: true })}
                      </Text>
                      {assignment.reason ? (
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          Reason: {assignment.reason}
                        </Text>
                      ) : null}
                    </Stack>
                  </SectionCard>
                ))}
              </Stack>
            ) : (
              <EmptyState>No assignments recorded for this task yet.</EmptyState>
            )}

            <Divider label='Handoffs' />
            {detail.handoffs.length > 0 ? (
              <Stack gap='xs'>
                {detail.handoffs.map((handoff) => {
                  const attention = handoffAttentionById.get(handoff.handoff_id)

                  return (
                    <SectionCard
                      key={handoff.handoff_id}
                      p='sm'
                    >
                      <Stack gap={4}>
                        <Group gap='xs'>
                          <Badge
                            color={handoff.status === 'open' ? 'yellow' : 'gray'}
                            size='xs'
                            variant='light'
                          >
                            {handoff.status}
                          </Badge>
                          <Badge
                            color='grape'
                            size='xs'
                            variant='outline'
                          >
                            {handoff.handoff_type}
                          </Badge>
                          {attention ? (
                            <>
                              <Badge
                                color={attentionColor(attention.level)}
                                size='xs'
                                variant='light'
                              >
                                {attentionSummaryLabel(attention.level)}
                              </Badge>
                              <Badge
                                color={freshnessColor(attention.freshness)}
                                size='xs'
                                variant='outline'
                              >
                                {attention.freshness}
                              </Badge>
                            </>
                          ) : null}
                        </Group>
                        <Text size='sm'>{handoff.summary}</Text>
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          {handoff.from_agent_id} → {handoff.to_agent_id}
                        </Text>
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          Created {timeAgo(handoff.created_at, { allowMonths: true })}
                        </Text>
                        {handoff.due_at ? (
                          <Text
                            c='dimmed'
                            size='sm'
                          >
                            Due {timeAgo(handoff.due_at, { allowMonths: true })}
                          </Text>
                        ) : null}
                        {handoff.expires_at ? (
                          <Text
                            c='dimmed'
                            size='sm'
                          >
                            Expires {timeAgo(handoff.expires_at, { allowMonths: true })}
                          </Text>
                        ) : null}
                        {attention?.reasons.length ? (
                          <Text
                            c='dimmed'
                            size='sm'
                          >
                            Reasons: {joinedReasons(attention.reasons)}
                          </Text>
                        ) : null}
                        {handoff.resolved_at ? (
                          <Text
                            c='dimmed'
                            size='sm'
                          >
                            Resolved {timeAgo(handoff.resolved_at, { allowMonths: true })}
                          </Text>
                        ) : null}
                      </Stack>
                    </SectionCard>
                  )
                })}
              </Stack>
            ) : (
              <EmptyState>No handoffs attached to this task.</EmptyState>
            )}

            <Divider label='Council' />
            {detail.messages.length > 0 ? (
              <Stack gap='xs'>
                {detail.messages.map((message) => (
                  <SectionCard
                    key={message.message_id}
                    p='sm'
                  >
                    <Stack gap={4}>
                      <Group gap='xs'>
                        <Badge
                          color='blue'
                          size='xs'
                          variant='light'
                        >
                          {message.message_type}
                        </Badge>
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          {message.author_agent_id}
                        </Text>
                      </Group>
                      <Text size='sm'>{message.body}</Text>
                    </Stack>
                  </SectionCard>
                ))}
              </Stack>
            ) : (
              <EmptyState>No Council messages for this task.</EmptyState>
            )}

            <Divider label='Evidence' />
            {detail.evidence.length > 0 ? (
              <Stack gap='xs'>
                {detail.evidence.map((item) => {
                  const links = evidenceLinks(item)

                  return (
                    <SectionCard
                      key={item.evidence_id}
                      p='sm'
                    >
                      <Stack gap={4}>
                        <Group gap='xs'>
                          <Badge
                            color='teal'
                            size='xs'
                            variant='light'
                          >
                            {item.source_kind}
                          </Badge>
                          <Text fw={500}>{item.label}</Text>
                        </Group>
                        <Text
                          c='dimmed'
                          size='sm'
                        >
                          {item.source_ref}
                        </Text>
                        {item.summary ? <Text size='sm'>{item.summary}</Text> : null}
                        {links.length > 0 ? (
                          <Group gap='xs'>
                            {links.map((link) => (
                              <Button
                                component={Link}
                                key={`${item.evidence_id}-${link.label}`}
                                size='xs'
                                to={link.to}
                                variant='subtle'
                              >
                                {link.label}
                              </Button>
                            ))}
                          </Group>
                        ) : null}
                      </Stack>
                    </SectionCard>
                  )
                })}
              </Stack>
            ) : (
              <EmptyState>No evidence attached to this task.</EmptyState>
            )}
          </Stack>
        </ScrollArea.Autosize>
      )}
    </Modal>
  )
}
