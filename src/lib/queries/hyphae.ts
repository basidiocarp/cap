import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { hyphaeApi } from '../api'

export const hyphaeKeys = {
  analytics: () => ['hyphae', 'analytics'] as const,
  context: (task: string, project?: string) => ['hyphae', 'context', task, project] as const,
  health: (topic?: string) => ['hyphae', 'health', topic] as const,
  lessons: () => ['hyphae', 'lessons'] as const,
  memoir: (name: string, options?: { limit?: number; offset?: number; q?: string }) =>
    ['hyphae', 'memoir', name, options?.limit, options?.offset, options?.q] as const,
  memoirInspect: (memoir: string, concept: string, depth?: number) => ['hyphae', 'memoir', memoir, 'inspect', concept, depth] as const,
  memoirSearch: (memoir: string, q: string) => ['hyphae', 'memoir', memoir, 'search', q] as const,
  memoirSearchAll: (q: string) => ['hyphae', 'memoirSearchAll', q] as const,
  memoirs: () => ['hyphae', 'memoirs'] as const,
  memory: (id: string) => ['hyphae', 'memory', id] as const,
  recall: (q: string, topic?: string, limit?: number) => ['hyphae', 'recall', q, topic, limit] as const,
  searchGlobal: (q: string, limit?: number) => ['hyphae', 'searchGlobal', q, limit] as const,
  sessions: (project?: string, limit?: number) => ['hyphae', 'sessions', project, limit] as const,
  sessionTimeline: (project?: string, limit?: number) => ['hyphae', 'sessions', 'timeline', project, limit] as const,
  sources: () => ['hyphae', 'sources'] as const,
  stats: () => ['hyphae', 'stats'] as const,
  topicMemories: (topic: string, limit?: number) => ['hyphae', 'topicMemories', topic, limit] as const,
  topics: () => ['hyphae', 'topics'] as const,
}

export function useContext(task: string, project?: string) {
  return useQuery({
    enabled: !!task.trim(),
    queryFn: () => hyphaeApi.context(task, project),
    queryKey: hyphaeKeys.context(task, project),
  })
}

export function useStats() {
  return useQuery({ queryFn: () => hyphaeApi.stats(), queryKey: hyphaeKeys.stats() })
}

export function useTopics() {
  return useQuery({ queryFn: () => hyphaeApi.topics(), queryKey: hyphaeKeys.topics() })
}

export function useHealth(topic?: string) {
  return useQuery({ queryFn: () => hyphaeApi.health(topic), queryKey: hyphaeKeys.health(topic) })
}

export function useRecall(q: string, topic?: string, limit?: number) {
  return useQuery({
    enabled: !!q.trim(),
    queryFn: () => hyphaeApi.recall(q, topic, limit),
    queryKey: hyphaeKeys.recall(q, topic, limit),
  })
}

export function useTopicMemories(topic: string, limit?: number) {
  return useQuery({
    enabled: !!topic,
    queryFn: () => hyphaeApi.topicMemories(topic, limit),
    queryKey: hyphaeKeys.topicMemories(topic, limit),
  })
}

export function useMemoirs() {
  return useQuery({ queryFn: () => hyphaeApi.memoirs(), queryKey: hyphaeKeys.memoirs() })
}

export function useMemory(id: string) {
  return useQuery({
    enabled: !!id,
    queryFn: () => hyphaeApi.memory(id),
    queryKey: hyphaeKeys.memory(id),
  })
}

export function useMemoir(name: string, options?: { limit?: number; offset?: number; q?: string }) {
  return useQuery({
    enabled: !!name,
    placeholderData: keepPreviousData,
    queryFn: () => hyphaeApi.memoir(name, options),
    queryKey: hyphaeKeys.memoir(name, options),
  })
}

export function useMemoirInspect(memoir: string, concept: string, depth?: number) {
  return useQuery({
    enabled: !!memoir && !!concept,
    placeholderData: keepPreviousData,
    queryFn: () => hyphaeApi.memoirInspect(memoir, concept, depth),
    queryKey: hyphaeKeys.memoirInspect(memoir, concept, depth),
  })
}

export function useHyphaeAnalytics(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => hyphaeApi.analytics(),
    queryKey: hyphaeKeys.analytics(),
  })
}

export function useSearchGlobal(q: string, limit?: number) {
  return useQuery({
    enabled: !!q.trim(),
    queryFn: () => hyphaeApi.searchGlobal(q, limit),
    queryKey: hyphaeKeys.searchGlobal(q, limit),
  })
}

export function useSessions(project?: string, limit?: number) {
  return useQuery({
    queryFn: () => hyphaeApi.sessions(project, limit),
    queryKey: hyphaeKeys.sessions(project, limit),
  })
}

export function useSessionTimeline(project?: string, limit?: number) {
  return useQuery({
    queryFn: () => hyphaeApi.sessionTimeline(project, limit),
    queryKey: hyphaeKeys.sessionTimeline(project, limit),
  })
}

export function useLessons() {
  return useQuery({
    queryFn: () => hyphaeApi.lessons(),
    queryKey: hyphaeKeys.lessons(),
  })
}

export function useIngestionSources() {
  return useQuery({
    queryFn: () => hyphaeApi.sources(),
    queryKey: hyphaeKeys.sources(),
  })
}

export function useDeleteMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hyphaeApi.deleteMemory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hyphae'] })
    },
  })
}

export function useInvalidateMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => hyphaeApi.invalidateMemory(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hyphae'] })
      queryClient.invalidateQueries({ queryKey: hyphaeKeys.memory(variables.id) })
    },
  })
}

export function useUpdateImportance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, importance }: { id: string; importance: string }) => hyphaeApi.updateImportance(id, importance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hyphae'] })
    },
  })
}

export function useConsolidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (topic: string) => hyphaeApi.consolidate(topic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hyphae'] })
    },
  })
}
