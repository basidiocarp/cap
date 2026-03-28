import { Badge, Button, Divider, Grid, Group, Modal, ScrollArea, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import type {
  CanopyAgentHeartbeatEvent,
  CanopyAttentionLevel,
  CanopyFreshness,
  CanopyTask,
  CanopyTaskAttention,
  CanopyTaskDetail,
  CanopyTaskEvent,
  CanopyTaskPriority,
  CanopyTaskSeverity,
  CanopyTaskStatus,
} from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useCanopySnapshot, useCanopyTaskDetail, useProject } from '../lib/queries'
import { codeExplorerHref, memoriesHref, sessionsHref } from '../lib/routes'
import { timeAgo } from '../lib/time'

const STATUS_ORDER: CanopyTaskStatus[] = [
  'in_progress',
  'review_required',
  'blocked',
  'assigned',
  'open',
  'completed',
  'closed',
  'cancelled',
]

const STATUS_FILTER_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  ...STATUS_ORDER.map((status) => ({
    label: status.replaceAll('_', ' '),
    value: status,
  })),
]

const SAVED_VIEW_OPTIONS = [
  { description: 'Everything in the active project', label: 'All tasks', value: 'default' },
  { description: 'Tasks Canopy already marks as needing attention', label: 'Needs attention', value: 'attention' },
  { description: 'Review-required or pending verification', label: 'Review queue', value: 'review_queue' },
  { description: 'Blocked tasks and failed verification', label: 'Blocked focus', value: 'blocked' },
  { description: 'Tasks with open handoffs', label: 'Open handoffs', value: 'handoffs' },
  { description: 'Critical tasks from the runtime attention model', label: 'Critical queue', value: 'critical' },
  { description: 'Attention tasks that have not been acknowledged yet', label: 'Unacknowledged', value: 'unacknowledged' },
] as const

const SORT_OPTIONS = [
  { label: 'Status order', value: 'status' },
  { label: 'Title', value: 'title' },
  { label: 'Last updated', value: 'updated_at' },
  { label: 'Created at', value: 'created_at' },
  { label: 'Verification state', value: 'verification' },
  { label: 'Priority', value: 'priority' },
  { label: 'Severity', value: 'severity' },
  { label: 'Attention', value: 'attention' },
] as const

const PRIORITY_FILTER_OPTIONS = [
  { label: 'Any priority', value: 'all' },
  { label: 'Medium+', value: 'medium' },
  { label: 'High+', value: 'high' },
  { label: 'Critical only', value: 'critical' },
] as const

const SEVERITY_FILTER_OPTIONS = [
  { label: 'Any severity', value: 'all' },
  { label: 'Low+', value: 'low' },
  { label: 'Medium+', value: 'medium' },
  { label: 'High+', value: 'high' },
  { label: 'Critical only', value: 'critical' },
] as const

const ACK_FILTER_OPTIONS = [
  { label: 'All acknowledgment', value: 'all' },
  { label: 'Acknowledged', value: 'true' },
  { label: 'Unacknowledged', value: 'false' },
] as const

type CanopySavedView = (typeof SAVED_VIEW_OPTIONS)[number]['value']
type CanopySortMode = (typeof SORT_OPTIONS)[number]['value']
type CanopyPriorityFilter = (typeof PRIORITY_FILTER_OPTIONS)[number]['value']
type CanopySeverityFilter = (typeof SEVERITY_FILTER_OPTIONS)[number]['value']
type CanopyAcknowledgedFilter = (typeof ACK_FILTER_OPTIONS)[number]['value']
const SAVED_VIEW_VALUES = new Set<CanopySavedView>(SAVED_VIEW_OPTIONS.map((option) => option.value))
const SORT_VALUES = new Set<CanopySortMode>(SORT_OPTIONS.map((option) => option.value))
const STATUS_FILTER_VALUES = new Set<string>(STATUS_FILTER_OPTIONS.map((option) => option.value))
const PRIORITY_FILTER_VALUES = new Set<CanopyPriorityFilter>(PRIORITY_FILTER_OPTIONS.map((option) => option.value))
const SEVERITY_FILTER_VALUES = new Set<CanopySeverityFilter>(SEVERITY_FILTER_OPTIONS.map((option) => option.value))
const ACK_FILTER_VALUES = new Set<CanopyAcknowledgedFilter>(ACK_FILTER_OPTIONS.map((option) => option.value))

interface EvidenceLink {
  label: string
  to: string
}

function freshnessColor(freshness: CanopyFreshness | null | undefined): string {
  switch (freshness) {
    case 'fresh':
      return 'green'
    case 'aging':
      return 'yellow'
    case 'stale':
      return 'red'
    case 'missing':
      return 'gray'
    default:
      return 'gray'
  }
}

function attentionColor(level: CanopyAttentionLevel): string {
  switch (level) {
    case 'critical':
      return 'red'
    case 'needs_attention':
      return 'yellow'
    default:
      return 'green'
  }
}

function formatLabel(value: string): string {
  return value.replaceAll('_', ' ')
}

function joinedReasons(reasons: string[]): string {
  return reasons.map(formatLabel).join(', ')
}

function priorityColor(priority: CanopyTaskPriority): string {
  switch (priority) {
    case 'critical':
      return 'red'
    case 'high':
      return 'orange'
    case 'medium':
      return 'yellow'
    default:
      return 'gray'
  }
}

function severityColor(severity: CanopyTaskSeverity): string {
  switch (severity) {
    case 'critical':
      return 'red'
    case 'high':
      return 'orange'
    case 'medium':
      return 'yellow'
    case 'low':
      return 'blue'
    default:
      return 'gray'
  }
}

function heartbeatSourceLabel(source: CanopyAgentHeartbeatEvent['source']): string {
  if (source === 'task_sync') return 'task sync'
  return source
}

function evidenceLinks(item: CanopyTaskDetail['evidence'][number]): EvidenceLink[] {
  const links: EvidenceLink[] = []

  if (item.related_session_id) {
    links.push({ label: 'Open session', to: sessionsHref({ session: item.related_session_id }) })
  } else if (item.source_kind === 'hyphae_session') {
    links.push({ label: 'Open session', to: sessionsHref({ session: item.source_ref }) })
  }

  if (item.related_memory_query) {
    links.push({ label: 'Search memories', to: memoriesHref({ q: item.related_memory_query }) })
  } else if (item.source_kind === 'hyphae_session') {
    links.push({ label: 'Search session memories', to: memoriesHref({ q: item.source_ref }) })
  } else if (['hyphae_recall', 'hyphae_outcome', 'cortina_event', 'manual_note'].includes(item.source_kind)) {
    links.push({ label: 'Search memories', to: memoriesHref({ q: item.source_ref }) })
  }

  if (item.related_file || item.related_symbol) {
    links.push({
      label: 'Open code explorer',
      to: codeExplorerHref({
        file: item.related_file ?? undefined,
        symbol: item.related_symbol ?? undefined,
      }),
    })
  } else if (item.source_kind === 'rhizome_impact' || item.source_kind === 'rhizome_export') {
    links.push({ label: 'Open code explorer', to: codeExplorerHref({ filter: item.source_ref }) })
  }

  if (links.length === 0 && (item.source_kind === 'mycelium_command' || item.source_kind === 'mycelium_explain')) {
    links.push({ label: 'Open sessions', to: sessionsHref() })
  }

  return links
}

function statusColor(status: CanopyTaskStatus): string {
  switch (status) {
    case 'completed':
    case 'closed':
      return 'green'
    case 'review_required':
      return 'yellow'
    case 'blocked':
      return 'red'
    case 'in_progress':
    case 'assigned':
      return 'blue'
    case 'cancelled':
      return 'gray'
    default:
      return 'grape'
  }
}

function verificationColor(state: string): string {
  switch (state) {
    case 'passed':
      return 'green'
    case 'failed':
      return 'red'
    case 'pending':
      return 'yellow'
    default:
      return 'gray'
  }
}

function attentionSummaryLabel(level: CanopyAttentionLevel): string {
  if (level === 'needs_attention') return 'needs attention'
  return level
}

function eventTitle(event: CanopyTaskEvent): string {
  switch (event.event_type) {
    case 'created':
      return 'Task created'
    case 'assigned':
      return 'Task assigned'
    case 'ownership_transferred':
      return 'Ownership transferred'
    case 'status_changed':
      return `Status changed to ${event.to_status}`
    case 'triage_updated':
      return 'Triage updated'
    default:
      return event.event_type
  }
}

function TaskStatusBadge({ task }: { task: CanopyTask }) {
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

function TaskCard({ attention, onOpen, task }: { attention?: CanopyTaskAttention; onOpen: (taskId: string) => void; task: CanopyTask }) {
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
            Owner heartbeat: {formatLabel(attention.owner_heartbeat_freshness)}
          </Text>
        ) : null}
        {attention?.open_handoff_freshness ? (
          <Text
            c='dimmed'
            size='sm'
          >
            Open handoff: {formatLabel(attention.open_handoff_freshness)}
          </Text>
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

function TaskDetailModal({
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
                {detail.evidence.map((item) => (
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
                      {evidenceLinks(item).length > 0 ? (
                        <Group gap='xs'>
                          {evidenceLinks(item).map((link) => (
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
                ))}
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

export function Canopy() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTaskId = searchParams.get('task') ?? ''
  const searchQuery = searchParams.get('q') ?? ''
  const presetParam = searchParams.get('preset')
  const priorityParam = searchParams.get('priority')
  const severityParam = searchParams.get('severity')
  const acknowledgedParam = searchParams.get('ack')
  const sortParam = searchParams.get('sort')
  const statusParam = searchParams.get('status')
  const viewParam = searchParams.get('view')
  const sortMode: CanopySortMode = sortParam && SORT_VALUES.has(sortParam as CanopySortMode) ? (sortParam as CanopySortMode) : 'status'
  const statusFilter = statusParam && STATUS_FILTER_VALUES.has(statusParam) ? statusParam : 'all'
  const legacyPreset = viewParam && SAVED_VIEW_VALUES.has(viewParam as CanopySavedView) ? (viewParam as CanopySavedView) : undefined
  const savedView: CanopySavedView =
    presetParam && SAVED_VIEW_VALUES.has(presetParam as CanopySavedView) ? (presetParam as CanopySavedView) : (legacyPreset ?? 'default')
  const priorityFilter: CanopyPriorityFilter =
    priorityParam && PRIORITY_FILTER_VALUES.has(priorityParam as CanopyPriorityFilter) ? (priorityParam as CanopyPriorityFilter) : 'all'
  const severityFilter: CanopySeverityFilter =
    severityParam && SEVERITY_FILTER_VALUES.has(severityParam as CanopySeverityFilter) ? (severityParam as CanopySeverityFilter) : 'all'
  const acknowledgedFilter: CanopyAcknowledgedFilter =
    acknowledgedParam && ACK_FILTER_VALUES.has(acknowledgedParam as CanopyAcknowledgedFilter)
      ? (acknowledgedParam as CanopyAcknowledgedFilter)
      : 'all'
  const modalOpen = Boolean(selectedTaskId)
  const { data: project } = useProject()
  const activeProject = project?.active ?? null
  const criticalQueueSnapshotQuery = useCanopySnapshot({
    preset: 'critical',
    project: activeProject ?? undefined,
  })
  const unacknowledgedQueueSnapshotQuery = useCanopySnapshot({
    preset: 'unacknowledged',
    project: activeProject ?? undefined,
  })
  const blockedQueueSnapshotQuery = useCanopySnapshot({
    preset: 'blocked',
    project: activeProject ?? undefined,
  })
  const handoffQueueSnapshotQuery = useCanopySnapshot({
    preset: 'handoffs',
    project: activeProject ?? undefined,
  })
  const snapshotQuery = useCanopySnapshot({
    acknowledged: acknowledgedFilter === 'all' ? undefined : acknowledgedFilter,
    preset: savedView,
    priorityAtLeast: priorityFilter === 'all' ? undefined : priorityFilter,
    project: activeProject ?? undefined,
    severityAtLeast: severityFilter === 'all' ? undefined : severityFilter,
    sort: sortMode,
  })
  const detailQuery = useCanopyTaskDetail(selectedTaskId)
  const snapshot = snapshotQuery.data
  const criticalQueueSnapshot = criticalQueueSnapshotQuery.data
  const unacknowledgedQueueSnapshot = unacknowledgedQueueSnapshotQuery.data
  const blockedQueueSnapshot = blockedQueueSnapshotQuery.data
  const handoffQueueSnapshot = handoffQueueSnapshotQuery.data
  const taskAttentionById = useMemo(
    () => new Map(snapshot?.task_attention.map((attention) => [attention.task_id, attention]) ?? []),
    [snapshot?.task_attention]
  )
  const filteredTasks = useMemo(() => {
    if (!snapshot) return []
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return snapshot.tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description?.toLowerCase().includes(normalizedQuery) ?? false) ||
        (task.owner_note?.toLowerCase().includes(normalizedQuery) ?? false) ||
        task.task_id.toLowerCase().includes(normalizedQuery) ||
        (task.owner_agent_id?.toLowerCase().includes(normalizedQuery) ?? false)

      return matchesStatus && matchesQuery
    })
  }, [searchQuery, snapshot, statusFilter])

  const filteredTaskIds = new Set(filteredTasks.map((task) => task.task_id))
  const filteredOwnerAgentIds = new Set(filteredTasks.map((task) => task.owner_agent_id).filter(Boolean))
  const filteredAgents = useMemo(() => {
    if (!snapshot) return []
    return snapshot.agents.filter((agent) => agent.current_task_id && filteredTaskIds.has(agent.current_task_id))
  }, [filteredTaskIds, snapshot])
  const filteredAgentIds = new Set(filteredAgents.map((agent) => agent.agent_id))
  const filteredTaskAttention = useMemo(
    () => snapshot?.task_attention.filter((attention) => filteredTaskIds.has(attention.task_id)) ?? [],
    [filteredTaskIds, snapshot]
  )
  const filteredAgentAttention = useMemo(
    () =>
      snapshot?.agent_attention.filter(
        (attention) =>
          filteredAgentIds.has(attention.agent_id) ||
          filteredOwnerAgentIds.has(attention.agent_id) ||
          (attention.current_task_id ? filteredTaskIds.has(attention.current_task_id) : false)
      ) ?? [],
    [filteredAgentIds, filteredOwnerAgentIds, filteredTaskIds, snapshot]
  )
  const filteredHandoffs = useMemo(
    () => snapshot?.handoffs.filter((handoff) => filteredTaskIds.has(handoff.task_id)) ?? [],
    [filteredTaskIds, snapshot]
  )
  const filteredHandoffIds = new Set(filteredHandoffs.map((handoff) => handoff.handoff_id))
  const filteredHandoffAttention = useMemo(
    () => snapshot?.handoff_attention.filter((attention) => filteredHandoffIds.has(attention.handoff_id)) ?? [],
    [filteredHandoffIds, snapshot]
  )
  const filteredEvidence = useMemo(
    () => snapshot?.evidence.filter((item) => filteredTaskIds.has(item.task_id)) ?? [],
    [filteredTaskIds, snapshot]
  )
  const renderGroupedByStatus = sortMode === 'status'

  const groupedTasks = STATUS_ORDER.map((status) => ({
    status,
    tasks: filteredTasks.filter((task) => task.status === status),
  })).filter((group) => group.tasks.length > 0)

  const updateSearchParams = (
    updates: {
      ack?: string | null
      preset?: string | null
      priority?: string | null
      q?: string | null
      severity?: string | null
      sort?: string | null
      status?: string | null
      task?: string | null
    },
    options?: { replace?: boolean }
  ) => {
    const next = new URLSearchParams(searchParams)
    if ('preset' in updates) {
      next.delete('view')
    }

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'all' || (key === 'preset' && value === 'default')) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }

    setSearchParams(next, { replace: options?.replace ?? true })
  }

  const openTask = (taskId: string) => {
    updateSearchParams({ task: taskId }, { replace: false })
  }

  const closeTask = () => {
    updateSearchParams({ task: null }, { replace: false })
  }

  const openQueuePreset = (preset: CanopySavedView) => {
    updateSearchParams({
      ack: null,
      preset,
      priority: null,
      q: null,
      severity: null,
      sort: null,
      status: null,
      task: null,
    })
  }

  if (snapshotQuery.isLoading) {
    return <PageLoader />
  }

  return (
    <Stack>
      <Title order={2}>Canopy</Title>

      <ErrorAlert error={snapshotQuery.error} />
      <ErrorAlert error={detailQuery.error} />

      <Text
        c='dimmed'
        size='sm'
      >
        Showing Canopy coordination state{activeProject ? ` for ${activeProject}` : ''}.
      </Text>

      <SectionCard title='Task filters'>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label='Search tasks'
              onChange={(event) => updateSearchParams({ q: event.currentTarget.value, task: null })}
              placeholder='Filter by title, description, task id, or owner'
              value={searchQuery}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              data={STATUS_FILTER_OPTIONS}
              label='Status'
              onChange={(value) => updateSearchParams({ status: value ?? 'all', task: null })}
              value={statusFilter}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              data={SORT_OPTIONS}
              label='Sort'
              onChange={(value) => updateSearchParams({ sort: value ?? 'status', task: null })}
              value={sortMode}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              data={PRIORITY_FILTER_OPTIONS}
              label='Priority threshold'
              onChange={(value) => updateSearchParams({ priority: value ?? 'all', task: null })}
              value={priorityFilter}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              data={SEVERITY_FILTER_OPTIONS}
              label='Severity threshold'
              onChange={(value) => updateSearchParams({ severity: value ?? 'all', task: null })}
              value={severityFilter}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              data={ACK_FILTER_OPTIONS}
              label='Acknowledgment'
              onChange={(value) => updateSearchParams({ ack: value ?? 'all', task: null })}
              value={acknowledgedFilter}
            />
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard title='Saved views'>
        <Stack gap='sm'>
          <Text
            c='dimmed'
            size='sm'
          >
            Switch the board between common operator slices without rebuilding filters by hand.
          </Text>
          <Group gap='xs'>
            {SAVED_VIEW_OPTIONS.map((view) => (
              <Button
                key={view.value}
                onClick={() => updateSearchParams({ preset: view.value, task: null })}
                size='xs'
                variant={savedView === view.value ? 'filled' : 'light'}
              >
                {view.label}
              </Button>
            ))}
          </Group>
          <Text
            c='dimmed'
            size='xs'
          >
            {SAVED_VIEW_OPTIONS.find((view) => view.value === savedView)?.description}. Runtime sort: {sortMode.replaceAll('_', ' ')}.
          </Text>
        </Stack>
      </SectionCard>

      <SectionCard title='Operator queues'>
        <Grid>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Button
              fullWidth
              onClick={() => openQueuePreset('critical')}
              variant={savedView === 'critical' ? 'filled' : 'light'}
            >
              Critical
              {' · '}
              {criticalQueueSnapshot?.tasks.length ?? 0}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Button
              fullWidth
              onClick={() => openQueuePreset('unacknowledged')}
              variant={savedView === 'unacknowledged' ? 'filled' : 'light'}
            >
              Unacknowledged
              {' · '}
              {unacknowledgedQueueSnapshot?.tasks.length ?? 0}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Button
              fullWidth
              onClick={() => openQueuePreset('blocked')}
              variant={savedView === 'blocked' ? 'filled' : 'light'}
            >
              Blocked
              {' · '}
              {blockedQueueSnapshot?.tasks.length ?? 0}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Button
              fullWidth
              onClick={() => openQueuePreset('handoffs')}
              variant={savedView === 'handoffs' ? 'filled' : 'light'}
            >
              Open handoffs
              {' · '}
              {handoffQueueSnapshot?.tasks.length ?? 0}
            </Button>
          </Grid.Col>
        </Grid>
      </SectionCard>

      <Grid>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <SectionCard title='Active Agents'>
            <Text size='xl'>{filteredAgents.length}</Text>
          </SectionCard>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <SectionCard title='Active Tasks'>
            <Text size='xl'>{filteredTasks.filter((task) => !['completed', 'closed', 'cancelled'].includes(task.status)).length}</Text>
          </SectionCard>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <SectionCard title='Needs Attention'>
            <Text size='xl'>{filteredTaskAttention.filter((attention) => attention.level !== 'normal').length}</Text>
          </SectionCard>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <SectionCard title='Open Handoffs'>
            <Text size='xl'>{filteredHandoffs.filter((handoff) => handoff.status === 'open').length}</Text>
          </SectionCard>
        </Grid.Col>
      </Grid>

      <SectionCard title='Operator Snapshot'>
        <Group gap='xs'>
          <Badge
            color='red'
            variant='light'
          >
            {filteredTaskAttention.filter((attention) => attention.level === 'critical').length} critical tasks
          </Badge>
          <Badge
            color='yellow'
            variant='light'
          >
            {filteredTaskAttention.filter((attention) => attention.level !== 'normal').length} need attention
          </Badge>
          <Badge
            color='orange'
            variant='light'
          >
            {filteredAgentAttention.filter((attention) => attention.freshness === 'stale').length} stale agents
          </Badge>
          <Badge
            color='grape'
            variant='light'
          >
            {filteredHandoffAttention.filter((attention) => attention.freshness === 'stale').length} stale handoffs
          </Badge>
          <Badge
            color='teal'
            variant='light'
          >
            {filteredEvidence.length} evidence refs
          </Badge>
        </Group>
      </SectionCard>

      {filteredTasks.length === 0 ? (
        <SectionCard title='Tasks'>
          <EmptyState>
            {searchQuery || statusFilter !== 'all'
              ? 'No Canopy tasks match the current filters.'
              : 'No Canopy tasks are in scope for the active project yet.'}
          </EmptyState>
        </SectionCard>
      ) : !renderGroupedByStatus ? (
        <SectionCard title={`Tasks (${filteredTasks.length})`}>
          <Stack gap='md'>
            {filteredTasks.map((task) => (
              <TaskCard
                attention={taskAttentionById.get(task.task_id)}
                key={task.task_id}
                onOpen={openTask}
                task={task}
              />
            ))}
          </Stack>
        </SectionCard>
      ) : (
        <Stack gap='md'>
          {groupedTasks.map((group) => (
            <SectionCard
              key={group.status}
              title={`${group.status.replaceAll('_', ' ')} (${group.tasks.length})`}
            >
              <Stack gap='md'>
                {group.tasks.map((task) => (
                  <TaskCard
                    attention={taskAttentionById.get(task.task_id)}
                    key={task.task_id}
                    onOpen={openTask}
                    task={task}
                  />
                ))}
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      )}

      <TaskDetailModal
        detail={detailQuery.data}
        error={detailQuery.error}
        onClose={closeTask}
        opened={modalOpen}
      />
    </Stack>
  )
}
