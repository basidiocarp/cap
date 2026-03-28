import { Badge, Button, Divider, Grid, Group, Modal, ScrollArea, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import type { CanopyAgentHeartbeatEvent, CanopyTask, CanopyTaskDetail, CanopyTaskEvent, CanopyTaskStatus } from '../lib/api'
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
  { description: 'Everything in the active project', label: 'All tasks', value: 'all' },
  { description: 'Open, assigned, and in-progress work', label: 'Active work', value: 'active' },
  { description: 'Blocked tasks and failed verification', label: 'Blocked focus', value: 'blocked' },
  { description: 'Review-required or pending verification', label: 'Review queue', value: 'review' },
  { description: 'Tasks with open handoffs', label: 'Open handoffs', value: 'handoffs' },
] as const

const SORT_OPTIONS = [
  { label: 'Status order', value: 'status' },
  { label: 'Title', value: 'title' },
  { label: 'Last updated', value: 'updated_at' },
  { label: 'Created at', value: 'created_at' },
  { label: 'Verification state', value: 'verification' },
] as const

type CanopySavedView = (typeof SAVED_VIEW_OPTIONS)[number]['value']
type CanopySortMode = (typeof SORT_OPTIONS)[number]['value']
const SAVED_VIEW_VALUES = new Set<CanopySavedView>(SAVED_VIEW_OPTIONS.map((option) => option.value))
const SORT_VALUES = new Set<CanopySortMode>(SORT_OPTIONS.map((option) => option.value))
const STATUS_FILTER_VALUES = new Set<string>(STATUS_FILTER_OPTIONS.map((option) => option.value))

interface EvidenceLink {
  label: string
  to: string
}

function ageHours(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const timestamp = new Date(dateStr).getTime()
  if (Number.isNaN(timestamp)) return null
  return (Date.now() - timestamp) / 3_600_000
}

function isOpenTask(task: CanopyTask): boolean {
  return ['open', 'assigned', 'in_progress', 'blocked', 'review_required'].includes(task.status)
}

function taskAgeTone(task: CanopyTask): { color: string; label: string } {
  const age = ageHours(task.updated_at)
  if (!isOpenTask(task) || age == null) return { color: 'gray', label: 'stable' }
  if (age >= 24) return { color: 'red', label: 'stale' }
  if (age >= 6) return { color: 'yellow', label: 'aging' }
  return { color: 'green', label: 'fresh' }
}

function handoffAgeTone(createdAt: string, status: string): { color: string; label: string } {
  const age = ageHours(createdAt)
  if (status !== 'open' || age == null) return { color: 'gray', label: 'resolved' }
  if (age >= 24) return { color: 'red', label: 'stale' }
  if (age >= 6) return { color: 'yellow', label: 'aging' }
  return { color: 'green', label: 'fresh' }
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

function TaskCard({ onOpen, task }: { onOpen: (taskId: string) => void; task: CanopyTask }) {
  const freshness = taskAgeTone(task)

  return (
    <SectionCard title={task.title}>
      <Stack gap='sm'>
        <Group justify='space-between'>
          <TaskStatusBadge task={task} />
          <Badge
            color={freshness.color}
            variant='outline'
          >
            {freshness.label}
          </Badge>
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

function TaskDetailModal({ detail, opened, onClose }: { detail: CanopyTaskDetail | undefined; opened: boolean; onClose: () => void }) {
  return (
    <Modal
      centered
      onClose={onClose}
      opened={opened}
      size='xl'
      title={detail?.task.title ?? 'Task detail'}
    >
      {!detail ? (
        <PageLoader mt='md' />
      ) : (
        <ScrollArea.Autosize mah={560}>
          <Stack gap='md'>
            <Stack gap='xs'>
              <TaskStatusBadge task={detail.task} />
              <Text size='sm'>Task ID: {detail.task.task_id}</Text>
              <Group gap='xs'>
                <Badge
                  color={taskAgeTone(detail.task).color}
                  variant='outline'
                >
                  {taskAgeTone(detail.task).label}
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

            <Divider label='Handoffs' />
            {detail.handoffs.length > 0 ? (
              <Stack gap='xs'>
                {detail.handoffs.map((handoff) => {
                  const freshness = handoffAgeTone(handoff.created_at, handoff.status)
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
                          <Badge
                            color={freshness.color}
                            size='xs'
                            variant='outline'
                          >
                            {freshness.label}
                          </Badge>
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
  const sortParam = searchParams.get('sort')
  const statusParam = searchParams.get('status')
  const viewParam = searchParams.get('view')
  const sortMode: CanopySortMode = sortParam && SORT_VALUES.has(sortParam as CanopySortMode) ? (sortParam as CanopySortMode) : 'status'
  const statusFilter = statusParam && STATUS_FILTER_VALUES.has(statusParam) ? statusParam : 'all'
  const savedView: CanopySavedView =
    viewParam && SAVED_VIEW_VALUES.has(viewParam as CanopySavedView) ? (viewParam as CanopySavedView) : 'all'
  const modalOpen = Boolean(selectedTaskId)
  const { data: project } = useProject()
  const activeProject = project?.active ?? null
  const snapshotQuery = useCanopySnapshot({
    project: activeProject ?? undefined,
    sort: sortMode,
    view: savedView,
  })
  const detailQuery = useCanopyTaskDetail(selectedTaskId)
  const snapshot = snapshotQuery.data
  const filteredTasks = useMemo(() => {
    if (!snapshot) return []
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return snapshot.tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description?.toLowerCase().includes(normalizedQuery) ?? false) ||
        task.task_id.toLowerCase().includes(normalizedQuery) ||
        (task.owner_agent_id?.toLowerCase().includes(normalizedQuery) ?? false)

      return matchesStatus && matchesQuery
    })
  }, [searchQuery, snapshot, statusFilter])

  const filteredTaskIds = new Set(filteredTasks.map((task) => task.task_id))
  const filteredAgents = useMemo(() => {
    if (!snapshot) return []
    return snapshot.agents.filter((agent) => agent.current_task_id && filteredTaskIds.has(agent.current_task_id))
  }, [filteredTaskIds, snapshot])
  const filteredHandoffs = useMemo(
    () => snapshot?.handoffs.filter((handoff) => filteredTaskIds.has(handoff.task_id)) ?? [],
    [filteredTaskIds, snapshot]
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
      q?: string | null
      sort?: string | null
      status?: string | null
      task?: string | null
      view?: string | null
    },
    options?: { replace?: boolean }
  ) => {
    const next = new URLSearchParams(searchParams)

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'all') {
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
                onClick={() => updateSearchParams({ task: null, view: view.value })}
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
          <SectionCard title='Blocked'>
            <Text size='xl'>{filteredTasks.filter((task) => task.status === 'blocked').length}</Text>
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
            color='blue'
            variant='light'
          >
            {filteredTasks.filter((task) => task.status === 'review_required').length} review required
          </Badge>
          <Badge
            color='red'
            variant='light'
          >
            {filteredTasks.filter((task) => task.verification_state === 'failed').length} verification failed
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
        onClose={closeTask}
        opened={modalOpen}
      />
    </Stack>
  )
}
