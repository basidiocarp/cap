export interface SessionRecord {
  id: string
  project: string
  scope?: string | null
  task: string | null
  started_at: string
  ended_at: string | null
  summary: string | null
  files_modified: string | null
  errors: string | null
  status: string
}

export interface SessionTimelineEntry {
  detail: string | null
  id: string
  kind: 'outcome' | 'recall'
  memory_count: number | null
  occurred_at: string
  recall_event_id: string | null
  signal_type: string | null
  signal_value: number | null
  source: string | null
  title: string
}

export interface SessionTimelineRecord extends SessionRecord {
  events: SessionTimelineEntry[]
  last_activity_at: string
  outcome_count: number
  recall_count: number
}

export interface Lesson {
  id: string
  category: 'corrections' | 'errors' | 'tests'
  description: string
  frequency: number
  source_topics: string[]
  keywords: string[]
}
