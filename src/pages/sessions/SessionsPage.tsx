import { Stack, Text, Title } from '@mantine/core'

import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { ProjectContextSummary } from '../../components/ProjectContextSummary'
import { SectionCard } from '../../components/SectionCard'
import { StipeActionFeedback } from '../../components/StipeActionFeedback'
import { SessionCard } from './SessionCard'
import { SessionDetailModal } from './SessionDetailModal'
import { ToolContextCard } from './session-coverage'
import { commandsForSession } from './session-utils'
import { useSessionTimelineViewModel } from './useSessionTimelineViewModel'

export function SessionsPage() {
  const {
    actionIsRunning,
    activeProject,
    activeProjectName,
    commands,
    coverageIssues,
    projectQuery,
    recentProjects,
    refreshView,
    rhizomeStatus,
    runStipe,
    runStipeAction,
    selectedSession,
    sessions,
    timelineQuery,
    closeSessionDetail,
    openSessionDetail,
  } = useSessionTimelineViewModel()

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
                onOpenDetail={() => openSessionDetail(session.id)}
                session={session}
              />
            ))}
          </Stack>
        )}
      </SectionCard>

      {selectedSession ? (
        <SessionDetailModal
          commands={commandsForSession(selectedSession, commands)}
          onClose={closeSessionDetail}
          session={selectedSession}
        />
      ) : null}
    </Stack>
  )
}
