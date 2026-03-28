import type { ReactNode } from 'react'
import { Badge, Card, Divider, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck, IconClock, IconFiles, IconHistory, IconSearch } from '@tabler/icons-react'

import type { AllowedStipeAction } from '../lib/onboarding'
import type { EcosystemReadinessModel, ReadinessQuickAction } from '../lib/readiness'
import type { CommandHistoryEntry, EcosystemStatus, RhizomeStatus, SessionTimelineEntry, SessionTimelineRecord } from '../lib/types'
import { ActionEmptyState } from '../components/ActionEmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { ProjectContextSummary } from '../components/ProjectContextSummary'
import { ReadinessQuickActions } from '../components/ReadinessQuickActions'
import { SectionCard } from '../components/SectionCard'
import { StipeActionFeedback } from '../components/StipeActionFeedback'
import { useEcosystemStatusController } from '../lib/ecosystem-status'
import { useCommandHistory, useProject, useRhizomeStatus, useSessionTimeline } from '../lib/queries'
import { getEcosystemReadinessModel, getToolQuickActions } from '../lib/readiness'
import { useStipeActionController } from '../lib/stipe-actions'
import { timeAgo } from '../lib/time'
import { useProjectContextView } from '../store/project-context'

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'mycelium'
    case 'in-progress':
    case 'active':
      return 'yellow'
    case 'failed':
    case 'error':
      return 'red'
    default:
      return 'gray'
  }
}

function formatDuration(startStr: string, endStr?: string | null): string {
  if (!endStr) return 'In progress'
  const start = new Date(startStr).getTime()
  const end = new Date(endStr).getTime()
  const diffMs = Math.max(0, end - start)
  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

function parseJsonCount(raw: string | null | undefined): number {
  if (!raw) return 0

  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) return parsed.length
    if (typeof parsed === 'number' && Number.isFinite(parsed)) return parsed
    if (typeof parsed === 'string') {
      const value = Number(parsed)
      return Number.isFinite(value) ? value : 0
    }
  } catch {
    const value = Number(raw)
    if (Number.isFinite(value)) return value
  }

  return 0
}

function eventColor(event: SessionTimelineEntry): string {
  if (event.kind === 'recall') return 'blue'

  switch (event.signal_type) {
    case 'build_passed':
    case 'error_free_run':
    case 'error_resolved':
    case 'session_success':
    case 'test_passed':
    case 'test_pass':
      return 'green'
    case 'correction':
    case 'session_failure':
    case 'tool_error':
      return 'red'
    default:
      return 'gray'
  }
}

function eventIcon(event: SessionTimelineEntry) {
  if (event.kind === 'recall') return <IconSearch size={14} />
  if (event.signal_type === 'session_success' || event.signal_type === 'build_passed' || event.signal_type === 'test_passed') {
    return <IconCircleCheck size={14} />
  }
  return <IconHistory size={14} />
}

function EventRow({ event }: { event: SessionTimelineEntry }) {
  return (
    <Group
      align='flex-start'
      gap='sm'
      wrap='nowrap'
    >
      <ThemeIcon
        color={eventColor(event)}
        mt={2}
        radius='xl'
        size='md'
        variant='light'
      >
        {eventIcon(event)}
      </ThemeIcon>

      <Stack
        gap={2}
        style={{ flex: 1 }}
      >
        <Group
          gap='xs'
          justify='space-between'
        >
          <Text
            fw={500}
            size='sm'
          >
            {event.title}
          </Text>
          <Text
            c='dimmed'
            size='xs'
          >
            {timeAgo(event.occurred_at, { allowMonths: true })}
          </Text>
        </Group>

        {event.detail ? (
          <Text
            c='dimmed'
            size='sm'
          >
            {event.detail}
          </Text>
        ) : null}

        <Group gap='xs'>
          <Badge
            color={eventColor(event)}
            size='xs'
            variant='light'
          >
            {event.kind}
          </Badge>
          {event.memory_count != null ? (
            <Badge
              color='gray'
              size='xs'
              variant='outline'
            >
              {event.memory_count} {event.memory_count === 1 ? 'memory' : 'memories'}
            </Badge>
          ) : null}
          {event.signal_type ? (
            <Badge
              color='gray'
              size='xs'
              variant='outline'
            >
              {event.signal_type}
            </Badge>
          ) : null}
        </Group>
      </Stack>
    </Group>
  )
}

function commandWindowEnd(session: SessionTimelineRecord): number {
  return new Date(session.ended_at ?? session.last_activity_at).getTime()
}

function commandsForSession(session: SessionTimelineRecord, commands: CommandHistoryEntry[]): CommandHistoryEntry[] {
  const start = new Date(session.started_at).getTime()
  const end = commandWindowEnd(session)
  return commands.filter((command) => {
    const timestamp = new Date(command.timestamp).getTime()
    return timestamp >= start && timestamp <= end
  })
}

interface CoverageIssue {
  actions: ReadinessQuickAction[]
  description: string
  hint?: string
  title: string
}

function buildCoverageIssues(
  commandCount: number,
  readiness: EcosystemReadinessModel | null,
  sessions: SessionTimelineRecord[],
  status: EcosystemStatus | undefined
): CoverageIssue[] {
  if (!readiness || !status) {
    return []
  }

  const issues: CoverageIssue[] = []

  if (!status.hyphae.available) {
    issues.push({
      actions: readiness.recommendedQuickActions,
      description: 'Hyphae is unavailable, so Cap cannot show structured session timelines for this project yet.',
      hint: 'Restore Hyphae first, then refresh this page to populate session activity and recall/outcome events.',
      title: 'Hyphae coverage needs attention',
    })
  } else if (sessions.length === 0) {
    issues.push({
      actions: getToolQuickActions('hyphae', readiness, status),
      description: 'No Hyphae sessions are currently in scope for the active project context.',
      hint: 'This usually means no structured session start/end and recall/outcome data has been recorded for the selected project yet.',
      title: 'No Hyphae sessions in scope yet',
    })
  }

  if (!status.mycelium.available) {
    issues.push({
      actions: readiness.recommendedQuickActions,
      description: 'Mycelium is unavailable, so Sessions cannot join command filtering and savings data into the operator timeline.',
      hint: 'Install or repair Mycelium, then refresh to recover project-scoped command history for each session window.',
      title: 'Mycelium coverage needs attention',
    })
  } else if (commandCount === 0) {
    issues.push({
      actions: getToolQuickActions('mycelium', readiness, status),
      description: 'No Mycelium commands matched the active project scope yet.',
      hint: 'The session cards will show filtered command history after Mycelium records activity for this project path.',
      title: 'No Mycelium command history in scope yet',
    })
  }

  if (!status.rhizome.available) {
    issues.push({
      actions: readiness.recommendedQuickActions,
      description: 'Rhizome is unavailable, so the session header cannot confirm code-intelligence backend health for this project.',
      hint: 'Repair or install Rhizome to restore backend visibility before moving into deeper operator and Canopy work.',
      title: 'Rhizome coverage needs attention',
    })
  }

  return issues
}

function CoverageIssueCard({
  actionIsRunning,
  issue,
  onRefresh,
  onRun,
}: {
  actionIsRunning: (actionKey?: AllowedStipeAction) => boolean
  issue: CoverageIssue
  onRefresh: () => void
  onRun: (actionKey: AllowedStipeAction) => void
}) {
  return (
    <ActionEmptyState
      actions={
        <ReadinessQuickActions
          actionIsRunning={actionIsRunning}
          actions={issue.actions}
          onRefresh={onRefresh}
          onRun={onRun}
        />
      }
      description={issue.description}
      hint={issue.hint}
      title={issue.title}
    />
  )
}

function ToolContextCard({
  actionIsRunning,
  commandCount,
  coverageIssues,
  onRefresh,
  onRun,
  projectPath,
  rhizomeStatus,
  stipeFeedback,
}: {
  actionIsRunning: (actionKey?: AllowedStipeAction) => boolean
  commandCount: number
  coverageIssues: CoverageIssue[]
  onRefresh: () => void
  onRun: (actionKey: AllowedStipeAction) => void
  projectPath: string | null
  rhizomeStatus: RhizomeStatus | undefined
  stipeFeedback: ReactNode
}) {
  return (
    <SectionCard title='Tool Context'>
      <Stack gap='sm'>
        <Group gap='sm'>
          {projectPath ? (
            <Badge
              color='gray'
              size='lg'
              variant='outline'
            >
              {projectPath}
            </Badge>
          ) : null}
          <Badge
            color='mycelium'
            size='lg'
            variant='light'
          >
            {commandCount} Mycelium commands in scope
          </Badge>
          <Badge
            color={rhizomeStatus?.available ? 'green' : 'gray'}
            size='lg'
            variant='light'
          >
            Rhizome {rhizomeStatus?.available ? (rhizomeStatus.backend ?? 'available') : 'unavailable'}
          </Badge>
          {rhizomeStatus?.available ? (
            <Badge
              color='blue'
              size='lg'
              variant='light'
            >
              {rhizomeStatus.languages.length} languages
            </Badge>
          ) : null}
        </Group>
        <Text
          c='dimmed'
          size='sm'
        >
          The session timeline below is joined with project-scoped Mycelium command history. Rhizome status is shown here so you can see the
          current code-intelligence backend while reading session activity.
        </Text>
        {coverageIssues.length > 0 ? (
          <Stack gap='sm'>
            {coverageIssues.map((issue) => (
              <CoverageIssueCard
                actionIsRunning={actionIsRunning}
                issue={issue}
                key={issue.title}
                onRefresh={onRefresh}
                onRun={onRun}
              />
            ))}
            {stipeFeedback}
          </Stack>
        ) : null}
      </Stack>
    </SectionCard>
  )
}

function SessionCard({ session, commands }: { commands: CommandHistoryEntry[]; session: SessionTimelineRecord }) {
  const filesCount = parseJsonCount(session.files_modified)
  const errorCount = parseJsonCount(session.errors)
  const visibleEvents = session.events.slice(0, 8)
  const visibleCommands = commands.slice(0, 3)

  return (
    <Card
      p='md'
      withBorder
    >
      <Stack gap='sm'>
        <Group
          align='flex-start'
          justify='space-between'
        >
          <Stack gap={4}>
            <Group gap='xs'>
              <Title
                fw={600}
                order={4}
              >
                {session.task || 'Untitled Session'}
              </Title>
              <Badge
                color={statusColor(session.status)}
                size='sm'
                variant='light'
              >
                {session.status}
              </Badge>
              {session.scope ? (
                <Badge
                  color='gray'
                  size='sm'
                  variant='outline'
                >
                  {session.scope}
                </Badge>
              ) : null}
            </Group>
            <Text
              c='dimmed'
              size='sm'
            >
              {session.project}
            </Text>
            {session.summary ? (
              <Text
                c='dimmed'
                lineClamp={2}
                size='sm'
              >
                {session.summary}
              </Text>
            ) : null}
          </Stack>
          <Text
            c='dimmed'
            fw={500}
            size='sm'
          >
            {timeAgo(session.last_activity_at, { allowMonths: true })}
          </Text>
        </Group>

        <Group gap='lg'>
          <Group
            c='dimmed'
            gap={4}
          >
            <IconClock size={16} />
            <Text size='sm'>{formatDuration(session.started_at, session.ended_at)}</Text>
          </Group>

          {filesCount > 0 ? (
            <Group
              c='dimmed'
              gap={4}
            >
              <IconFiles size={16} />
              <Text size='sm'>{filesCount} files modified</Text>
            </Group>
          ) : null}

          {errorCount > 0 ? (
            <Group
              c='red'
              gap={4}
            >
              <IconAlertCircle size={16} />
              <Text size='sm'>{errorCount} errors</Text>
            </Group>
          ) : null}

          <Badge
            color='blue'
            size='sm'
            variant='light'
          >
            {session.recall_count} recalls
          </Badge>
          <Badge
            color='green'
            size='sm'
            variant='light'
          >
            {session.outcome_count} outcomes
          </Badge>
        </Group>

        {session.events.length > 0 ? (
          <>
            <Divider />
            <Stack gap='xs'>
              <Text
                fw={500}
                size='sm'
              >
                Activity
              </Text>
              {visibleEvents.map((event) => (
                <EventRow
                  event={event}
                  key={event.id}
                />
              ))}
              {session.events.length > visibleEvents.length ? (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Showing the most recent {visibleEvents.length} of {session.events.length} events.
                </Text>
              ) : null}
            </Stack>
          </>
        ) : (
          <Text
            c='dimmed'
            size='sm'
          >
            No structured recall or outcome events are attached to this session yet.
          </Text>
        )}

        {visibleCommands.length > 0 ? (
          <>
            <Divider />
            <Stack gap='xs'>
              <Text
                fw={500}
                size='sm'
              >
                Mycelium Commands
              </Text>
              {visibleCommands.map((command) => (
                <Group
                  gap='xs'
                  justify='space-between'
                  key={`${command.timestamp}-${command.command}`}
                >
                  <Stack gap={2}>
                    <Text
                      ff='monospace'
                      size='sm'
                    >
                      {command.command}
                    </Text>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      {command.saved_tokens.toLocaleString()} tokens saved
                    </Text>
                  </Stack>
                  <Group gap='xs'>
                    <Badge
                      color='mycelium'
                      size='sm'
                      variant='light'
                    >
                      {command.savings_pct.toFixed(0)}%
                    </Badge>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      {timeAgo(command.timestamp, { allowMonths: true })}
                    </Text>
                  </Group>
                </Group>
              ))}
              {commands.length > visibleCommands.length ? (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Showing the most recent {visibleCommands.length} of {commands.length} Mycelium commands in this session window.
                </Text>
              ) : null}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Card>
  )
}

export function Sessions() {
  const projectQuery = useProject()
  const { activeProject, recentProjects } = useProjectContextView(projectQuery.data ?? null)
  const activeProjectName = activeProject?.split('/').pop()
  const { refreshAll, repairPlanQuery, statusQuery } = useEcosystemStatusController()
  const { actionIsRunning, runAction: runStipeAction, runStipe } = useStipeActionController()
  const timelineQuery = useSessionTimeline(activeProjectName, 30)
  const commandHistoryQuery = useCommandHistory(100, true, activeProject ?? undefined)
  const rhizomeStatusQuery = useRhizomeStatus()

  if (timelineQuery.isLoading) {
    return <PageLoader />
  }

  if (timelineQuery.error) {
    return (
      <ErrorAlert
        error={timelineQuery.error}
        title='Failed to load session timeline'
      />
    )
  }

  const sessions = timelineQuery.data ?? []
  const commands = commandHistoryQuery.data?.commands ?? []
  const rhizomeStatus = rhizomeStatusQuery.data
  const status = statusQuery.data
  const readiness = status ? getEcosystemReadinessModel(status, repairPlanQuery.data) : null
  const coverageIssues = buildCoverageIssues(commands.length, readiness, sessions, status)

  function refreshView() {
    refreshAll()
    projectQuery.refetch()
    timelineQuery.refetch()
    commandHistoryQuery.refetch()
    rhizomeStatusQuery.refetch()
  }

  return (
    <Stack gap='lg'>
      <Title order={2}>Sessions Timeline</Title>

      <ProjectContextSummary
        activeProject={projectQuery.data?.active}
        mode='detailed'
        note={
          activeProjectName
            ? `Showing structured Hyphae session activity for the active project context: ${activeProjectName}.`
            : 'Showing structured Hyphae session activity across recent projects.'
        }
        recentProjects={projectQuery.data?.recent ?? recentProjects}
        selectorFullWidth
      />

      <ToolContextCard
        actionIsRunning={actionIsRunning}
        commandCount={commands.length}
        coverageIssues={coverageIssues}
        onRefresh={refreshView}
        onRun={runStipeAction}
        projectPath={activeProject}
        rhizomeStatus={rhizomeStatus}
        stipeFeedback={<StipeActionFeedback mutation={runStipe} />}
      />

      <SectionCard title={`Recent Sessions (${sessions.length})`}>
        {sessions.length === 0 ? (
          <Stack gap='sm'>
            <Text
              c='dimmed'
              size='sm'
            >
              No sessions found yet. Session timelines appear after Hyphae records structured sessions, recalls, and outcome signals.
            </Text>
          </Stack>
        ) : (
          <Stack gap='sm'>
            <Text
              c='dimmed'
              size='sm'
            >
              Each card joins session metadata with Hyphae recall events and Cortina outcome signals so you can see what was recalled and
              what happened next. When Mycelium history is available for the same project, the recent filtered commands for each session
              window appear alongside the Hyphae events.
            </Text>
            {sessions.map((session) => (
              <SessionCard
                commands={commandsForSession(session, commands)}
                key={session.id}
                session={session}
              />
            ))}
          </Stack>
        )}
      </SectionCard>
    </Stack>
  )
}
