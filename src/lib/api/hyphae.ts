import type {
  Concept,
  ConceptInspection,
  EvaluationResult,
  GatherContextResult,
  HealthResult,
  HyphaeAnalytics,
  IngestionSource,
  Lesson,
  Memoir,
  MemoirDetail,
  Memory,
  SessionRecord,
  SessionTimelineRecord,
  Stats,
  TopicSummary,
} from '../types'
import { del, get, post, put } from './http'

export const hyphaeApi = {
  analytics: () => get<HyphaeAnalytics>('/hyphae/analytics'),
  consolidate: (topic: string, keepOriginals?: boolean) =>
    post<{ result: string }>('/hyphae/consolidate', { keep_originals: keepOriginals, topic }),
  context: (task: string, project?: string, budget?: number) =>
    get<GatherContextResult>('/hyphae/context', {
      budget: budget ? String(budget) : '',
      project: project ?? '',
      task,
    }),
  deleteMemory: (id: string) => del<{ result: string }>(`/hyphae/memories/${encodeURIComponent(id)}`),
  evaluate: (days = 14) => get<EvaluationResult>('/hyphae/evaluate', { days: String(days) }),
  health: (topic?: string) => get<HealthResult[]>('/hyphae/health', { topic: topic ?? '' }),
  invalidateMemory: (id: string, reason?: string) =>
    post<{ result: string }>(`/hyphae/memories/${encodeURIComponent(id)}/invalidate`, reason ? { reason } : {}),
  lessons: () => get<Lesson[]>('/hyphae/lessons'),
  memoir: (name: string, options?: { limit?: number; offset?: number; q?: string }) =>
    get<MemoirDetail>(`/hyphae/memoirs/${encodeURIComponent(name)}`, {
      limit: options?.limit ? String(options.limit) : '',
      offset: options?.offset ? String(options.offset) : '',
      q: options?.q ?? '',
    }),
  memoirInspect: (memoir: string, concept: string, depth?: number) =>
    get<ConceptInspection>(`/hyphae/memoirs/${encodeURIComponent(memoir)}/inspect/${encodeURIComponent(concept)}`, {
      depth: depth ? String(depth) : '',
    }),
  memoirSearch: (memoir: string, q: string) => get<Concept[]>(`/hyphae/memoirs/${encodeURIComponent(memoir)}/search`, { q }),
  memoirSearchAll: (q: string) => get<Concept[]>('/hyphae/memoirs/search-all', { q }),
  memoirs: () => get<Memoir[]>('/hyphae/memoirs'),
  memory: (id: string) => get<Memory>(`/hyphae/memories/${encodeURIComponent(id)}`),
  recall: (q: string, topic?: string, limit?: number) =>
    get<Memory[]>('/hyphae/recall', { limit: limit ? String(limit) : '', q, topic: topic ?? '' }),
  searchGlobal: (q: string, limit?: number) => get<Memory[]>('/hyphae/search-global', { limit: limit ? String(limit) : '', q }),
  sessions: (project?: string, limit?: number) =>
    get<SessionRecord[]>('/hyphae/sessions', { limit: limit ? String(limit) : '', project: project ?? '' }),
  sessionTimeline: (project?: string, limit?: number) =>
    get<SessionTimelineRecord[]>('/hyphae/sessions/timeline', { limit: limit ? String(limit) : '', project: project ?? '' }),
  sources: () => get<IngestionSource[]>('/hyphae/sources'),
  stats: () => get<Stats>('/hyphae/stats'),
  topicMemories: (topic: string, limit?: number) =>
    get<Memory[]>(`/hyphae/topics/${encodeURIComponent(topic)}/memories`, { limit: limit ? String(limit) : '' }),
  topics: () => get<TopicSummary[]>('/hyphae/topics'),
  updateImportance: (id: string, importance: string) =>
    put<{ result: string }>(`/hyphae/memories/${encodeURIComponent(id)}/importance`, { importance }),
}
