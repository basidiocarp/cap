import type { SessionRecord, SessionTimelineRecord } from '../types.ts'
import type { SessionCliQuery } from './session-list-cli.ts'
import { getSessionListFromCli } from './session-list-cli.ts'
import { getSessionTimelineFromCli } from './session-timeline-cli.ts'

export async function getSessions(options: SessionCliQuery = {}, limit = 20): Promise<SessionRecord[]> {
  return getSessionListFromCli(options, limit)
}

export async function getSessionTimeline(options: SessionCliQuery = {}, limit = 20): Promise<SessionTimelineRecord[]> {
  return getSessionTimelineFromCli(options, limit)
}
