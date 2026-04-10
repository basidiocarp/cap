export interface SessionRecord {
  id: string
  project: string
  project_root?: string | null
  runtime_session_id?: string | null
  worktree_id?: string | null
  scope?: string | null
  task: string | null
  started_at: string
  ended_at: string | null
  summary: string | null
  files_modified: string | null
  errors: string | null
  status: string
}

export type SessionTimelineEventType = 'correction' | 'error' | 'export' | 'outcome' | 'recall' | 'summary' | 'test_fail' | 'test_pass'

export interface SessionTimelineEntry {
  content?: string | null
  detail: string | null
  id: string
  kind: 'outcome' | 'recall'
  memory_count: number | null
  occurred_at: string
  recall_event_id: string | null
  score?: number | null
  signal_type: string | null
  signal_value: number | null
  source: string | null
  timestamp?: string | null
  title: string
  type?: SessionTimelineEventType | null
}

export interface SessionTimelineRecord extends SessionRecord {
  events: SessionTimelineEntry[]
  last_activity_at: string
  outcome_count: number
  recall_count: number
}

export type SessionTimelineDetailEventType = 'correction' | 'error' | 'export' | 'recall' | 'summary' | 'test_fail' | 'test_pass'

export interface SessionTimelineDetailEvent {
  content: string
  score?: number
  timestamp: string
  type: SessionTimelineDetailEventType
}

export interface Lesson {
  id: string
  category: 'corrections' | 'errors' | 'tests'
  description: string
  frequency: number
  source_topics: string[]
  keywords: string[]
}
