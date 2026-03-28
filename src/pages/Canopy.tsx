import { Badge, Button, Divider, Grid, Group, Modal, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { CanopyTask, CanopyTaskDetail, CanopyTaskEvent, CanopyTaskStatus } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useCanopySnapshot, useCanopyTaskDetail, useProject } from '../lib/queries'
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
  return (
    <SectionCard title={task.title}>
      <Stack gap='sm'>
        <TaskStatusBadge task={task} />
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
          <Text
            c='dimmed'
            size='xs'
          >
            {task.project_root}
          </Text>
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

            <Divider label='Handoffs' />
            {detail.handoffs.length > 0 ? (
              <Stack gap='xs'>
                {detail.handoffs.map((handoff) => (
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
                      </Group>
                      <Text size='sm'>{handoff.summary}</Text>
                      <Text
                        c='dimmed'
                        size='sm'
                      >
                        {handoff.from_agent_id} → {handoff.to_agent_id}
                      </Text>
                    </Stack>
                  </SectionCard>
                ))}
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
  const [modalOpen, setModalOpen] = useState(Boolean(selectedTaskId))
  const { data: project } = useProject()
  const snapshotQuery = useCanopySnapshot()
  const detailQuery = useCanopyTaskDetail(selectedTaskId)

  const activeProject = project?.active ?? null
  const snapshot = snapshotQuery.data
  const filteredTasks = useMemo(() => {
    if (!snapshot) return []
    if (!activeProject) return snapshot.tasks
    return snapshot.tasks.filter((task) => task.project_root === activeProject)
  }, [activeProject, snapshot])

  const filteredTaskIds = new Set(filteredTasks.map((task) => task.task_id))
  const filteredAgents = useMemo(() => {
    if (!snapshot) return []
    if (!activeProject) return snapshot.agents
    return snapshot.agents.filter((agent) => agent.project_root === activeProject)
  }, [activeProject, snapshot])
  const filteredHandoffs = useMemo(
    () => snapshot?.handoffs.filter((handoff) => filteredTaskIds.has(handoff.task_id)) ?? [],
    [filteredTaskIds, snapshot]
  )
  const filteredEvidence = useMemo(
    () => snapshot?.evidence.filter((item) => filteredTaskIds.has(item.task_id)) ?? [],
    [filteredTaskIds, snapshot]
  )

  const groupedTasks = STATUS_ORDER.map((status) => ({
    status,
    tasks: filteredTasks.filter((task) => task.status === status),
  })).filter((group) => group.tasks.length > 0)

  const openTask = (taskId: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('task', taskId)
    setSearchParams(next)
    setModalOpen(true)
  }

  const closeTask = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('task')
    setSearchParams(next)
    setModalOpen(false)
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
          <EmptyState>No Canopy tasks are in scope for the active project yet.</EmptyState>
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
