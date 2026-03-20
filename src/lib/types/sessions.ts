export interface SessionRecord {
  id: string
  project: string
  task: string | null
  started_at: string
  ended_at: string | null
  summary: string | null
  files_modified: string | null
  errors: string | null
  status: string
}

export interface Lesson {
  id: string
  category: 'corrections' | 'errors' | 'tests'
  description: string
  frequency: number
  source_topics: string[]
  keywords: string[]
}
