import type { SessionTimelineEntry } from '../types'
import { get } from './http'

export const sessionsApi = {
  timeline: (sessionId: string) => get<SessionTimelineEntry[]>(`/sessions/${encodeURIComponent(sessionId)}/timeline`),
}
