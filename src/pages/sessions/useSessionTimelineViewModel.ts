import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useEcosystemStatusController } from '../../lib/ecosystem-status'
import { useCommandHistory, useProject, useRhizomeStatus, useSessionTimeline } from '../../lib/queries'
import { getEcosystemReadinessModel } from '../../lib/readiness'
import { useStipeActionController } from '../../lib/stipe-actions'
import { useProjectContextView } from '../../store/project-context'
import { buildCoverageIssues } from './session-coverage'

export function useSessionTimelineViewModel() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const projectQuery = useProject()
  const { activeProject, recentProjects } = useProjectContextView(projectQuery.data ?? null)
  const activeProjectName = activeProject?.split('/').pop()
  const { refreshAll, repairPlanQuery, statusQuery } = useEcosystemStatusController()
  const { actionIsRunning, runAction: runStipeAction, runStipe } = useStipeActionController()
  const timelineQuery = useSessionTimeline(activeProjectName, 30)
  const commandHistoryQuery = useCommandHistory(100, true, activeProject ?? undefined)
  const rhizomeStatusQuery = useRhizomeStatus()
  const sessions = timelineQuery.data ?? []
  const commands = commandHistoryQuery.data?.commands ?? []
  const rhizomeStatus = rhizomeStatusQuery.data
  const status = statusQuery.data
  const readiness = status ? getEcosystemReadinessModel(status, repairPlanQuery.data) : null
  const coverageIssues = buildCoverageIssues(commands.length, readiness, sessions, status)
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null
  const requestedSessionId = searchParams.get('session')
  const requestedDetail = searchParams.get('detail')

  useEffect(() => {
    if (selectedSessionId || sessions.length === 0) {
      return
    }

    if (requestedSessionId) {
      const matchedSession = sessions.find((session) => session.id === requestedSessionId)
      if (matchedSession) {
        setSelectedSessionId(matchedSession.id)
      }
      return
    }

    if (requestedDetail === 'latest') {
      setSelectedSessionId(sessions[0]?.id ?? null)
    }
  }, [requestedDetail, requestedSessionId, selectedSessionId, sessions])

  function refreshView() {
    refreshAll()
    projectQuery.refetch()
    timelineQuery.refetch()
    commandHistoryQuery.refetch()
    rhizomeStatusQuery.refetch()
  }

  function openSessionDetail(sessionId: string) {
    setSelectedSessionId(sessionId)
    setSearchParams({ session: sessionId })
  }

  function closeSessionDetail() {
    setSelectedSessionId(null)
    setSearchParams({})
  }

  return {
    actionIsRunning,
    activeProject,
    activeProjectName,
    closeSessionDetail,
    commands,
    coverageIssues,
    openSessionDetail,
    projectQuery,
    recentProjects,
    refreshView,
    rhizomeStatus,
    runStipe,
    runStipeAction,
    selectedSession,
    sessions,
    timelineQuery,
  }
}
