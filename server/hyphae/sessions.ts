import type { SessionTimelineRecord } from '../types.ts'
import { querySessions } from './session-records.ts'
import { hydrateSessionTimeline } from './session-timeline.ts'

export function getSessions(project?: string, limit = 20) {
  return querySessions(project, limit)
}

export function getSessionTimeline(project?: string, limit = 20): SessionTimelineRecord[] {
  const sessions = querySessions(project, limit)
  if (sessions.length === 0) return []

  const baseTimeline = sessions.map(
    (session): SessionTimelineRecord => ({
      ...session,
      events: [],
      last_activity_at: session.ended_at ?? session.started_at,
      outcome_count: 0,
      recall_count: 0,
    })
  )

  return hydrateSessionTimeline(baseTimeline)
}
