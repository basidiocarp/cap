import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { hyphaeApi, myceliumApi, rhizomeApi, settingsApi, statusApi, usageApi } from './api'

// Hyphae

export const hyphaeKeys = {
  analytics: () => ['hyphae', 'analytics'] as const,
  context: (task: string, project?: string) => ['hyphae', 'context', task, project] as const,
  health: (topic?: string) => ['hyphae', 'health', topic] as const,
  memoir: (name: string) => ['hyphae', 'memoir', name] as const,
  memoirInspect: (memoir: string, concept: string, depth?: number) => ['hyphae', 'memoir', memoir, 'inspect', concept, depth] as const,
  memoirSearch: (memoir: string, q: string) => ['hyphae', 'memoir', memoir, 'search', q] as const,
  memoirSearchAll: (q: string) => ['hyphae', 'memoirSearchAll', q] as const,
  memoirs: () => ['hyphae', 'memoirs'] as const,
  recall: (q: string, topic?: string, limit?: number) => ['hyphae', 'recall', q, topic, limit] as const,
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

export function useMemoir(name: string) {
  return useQuery({
    enabled: !!name,
    queryFn: () => hyphaeApi.memoir(name),
    queryKey: hyphaeKeys.memoir(name),
  })
}

export function useMemoirInspect(memoir: string, concept: string, depth?: number) {
  return useQuery({
    enabled: !!memoir && !!concept,
    queryFn: () => hyphaeApi.memoirInspect(memoir, concept, depth),
    queryKey: hyphaeKeys.memoirInspect(memoir, concept, depth),
  })
}

export function useHyphaeAnalytics() {
  return useQuery({ queryFn: () => hyphaeApi.analytics(), queryKey: hyphaeKeys.analytics() })
}

// Mycelium

export const myceliumKeys = {
  analytics: () => ['mycelium', 'analytics'] as const,
  gain: () => ['mycelium', 'gain'] as const,
}

export function useGain() {
  return useQuery({ queryFn: () => myceliumApi.gain(), queryKey: myceliumKeys.gain() })
}

export function useMyceliumAnalytics() {
  return useQuery({ queryFn: () => myceliumApi.analytics(), queryKey: myceliumKeys.analytics() })
}

// Rhizome

export const rhizomeKeys = {
  analytics: () => ['rhizome', 'analytics'] as const,
  annotations: (file: string) => ['rhizome', 'annotations', file] as const,
  callSites: (file: string, fn?: string) => ['rhizome', 'callSites', file, fn] as const,
  complexity: (file: string) => ['rhizome', 'complexity', file] as const,
  definition: (file: string, symbol: string) => ['rhizome', 'definition', file, symbol] as const,
  dependencies: (file: string) => ['rhizome', 'dependencies', file] as const,
  diagnostics: (file?: string) => ['rhizome', 'diagnostics', file] as const,
  exports: (file: string) => ['rhizome', 'exports', file] as const,
  files: (path?: string, depth?: number) => ['rhizome', 'files', path, depth] as const,
  scope: (file: string, line: number) => ['rhizome', 'scope', file, line] as const,
  search: (pattern: string, path?: string) => ['rhizome', 'search', pattern, path] as const,
  status: () => ['rhizome', 'status'] as const,
  summary: (file: string) => ['rhizome', 'summary', file] as const,
  symbolBody: (file: string, symbol: string, line?: number) => ['rhizome', 'symbolBody', file, symbol, line] as const,
  symbols: (file: string) => ['rhizome', 'symbols', file] as const,
  tests: (file: string) => ['rhizome', 'tests', file] as const,
  typeDefinitions: (file: string) => ['rhizome', 'typeDefinitions', file] as const,
}

export function useAnnotations(file: string) {
  return useQuery({
    enabled: !!file,
    queryFn: () => rhizomeApi.annotations(file),
    queryKey: rhizomeKeys.annotations(file),
  })
}

export function useComplexity(file: string) {
  return useQuery({
    enabled: !!file,
    queryFn: () => rhizomeApi.complexity(file),
    queryKey: rhizomeKeys.complexity(file),
  })
}

export function useDependencies(file: string) {
  return useQuery({
    enabled: !!file,
    queryFn: () => rhizomeApi.dependencies(file),
    queryKey: rhizomeKeys.dependencies(file),
  })
}

export function useRhizomeStatus() {
  return useQuery({
    queryFn: () => rhizomeApi.status(),
    queryKey: rhizomeKeys.status(),
    staleTime: 30_000,
  })
}

export function useFileTree(path?: string, depth?: number) {
  return useQuery({
    queryFn: () => rhizomeApi.files(path, depth),
    queryKey: rhizomeKeys.files(path, depth),
    staleTime: 60_000,
  })
}

export function useSymbols(file: string) {
  return useQuery({
    enabled: !!file,
    queryFn: () => rhizomeApi.symbols(file),
    queryKey: rhizomeKeys.symbols(file),
  })
}

export function useDefinition(file: string, symbol: string) {
  return useQuery({
    enabled: !!file && !!symbol,
    queryFn: () => rhizomeApi.definition(file, symbol),
    queryKey: rhizomeKeys.definition(file, symbol),
  })
}

export function useSymbolSearch(pattern: string, path?: string) {
  return useQuery({
    enabled: !!pattern.trim(),
    queryFn: () => rhizomeApi.search(pattern, path),
    queryKey: rhizomeKeys.search(pattern, path),
  })
}

export function useDiagnostics(file?: string) {
  return useQuery({
    queryFn: () => rhizomeApi.diagnostics(file),
    queryKey: rhizomeKeys.diagnostics(file),
  })
}

export function useRhizomeAnalytics() {
  return useQuery({ queryFn: () => rhizomeApi.analytics(), queryKey: rhizomeKeys.analytics() })
}

export function useCallSites(file: string, fn?: string) {
  return useQuery({
    enabled: !!file,
    queryFn: () => rhizomeApi.callSites(file, fn),
    queryKey: rhizomeKeys.callSites(file, fn),
  })
}

export function useExports(file: string) {
  return useQuery({
    enabled: !!file,
    queryFn: () => rhizomeApi.exports(file),
    queryKey: rhizomeKeys.exports(file),
  })
}

export function useScope(file: string, line: number) {
  return useQuery({
    enabled: !!file && line > 0,
    queryFn: () => rhizomeApi.scope(file, line),
    queryKey: rhizomeKeys.scope(file, line),
  })
}

export function useFileSummary(file: string) {
  return useQuery({
    enabled: !!file,
    queryFn: () => rhizomeApi.summary(file),
    queryKey: rhizomeKeys.summary(file),
  })
}

export function useSymbolBody(file: string, symbol: string, line?: number) {
  return useQuery({
    enabled: !!file && !!symbol,
    queryFn: () => rhizomeApi.symbolBody(file, symbol, line),
    queryKey: rhizomeKeys.symbolBody(file, symbol, line),
  })
}

// Status

export const statusKeys = {
  ecosystem: () => ['status', 'ecosystem'] as const,
}

export function useEcosystemStatus() {
  return useQuery({
    queryFn: () => statusApi.ecosystem(),
    queryKey: statusKeys.ecosystem(),
    refetchInterval: 30_000,
  })
}

// Usage

export const usageKeys = {
  aggregate: () => ['usage', 'aggregate'] as const,
  sessions: (since?: string, limit?: number) => ['usage', 'sessions', since, limit] as const,
  trend: (days?: number) => ['usage', 'trend', days] as const,
}

export function useUsageAggregate() {
  return useQuery({
    queryFn: () => usageApi.aggregate(),
    queryKey: usageKeys.aggregate(),
    staleTime: 60_000,
  })
}

export function useUsageTrend(days = 30) {
  return useQuery({
    queryFn: () => usageApi.trend(days),
    queryKey: usageKeys.trend(days),
    staleTime: 60_000,
  })
}

export function useUsageSessions(limit = 20) {
  return useQuery({
    queryFn: () => usageApi.sessions(undefined, limit),
    queryKey: usageKeys.sessions(undefined, limit),
    staleTime: 60_000,
  })
}

// Settings

export const settingsKeys = {
  get: () => ['settings'] as const,
  modes: () => ['settings', 'modes'] as const,
}

export function useSettings() {
  return useQuery({
    queryFn: () => settingsApi.get(),
    queryKey: settingsKeys.get(),
    staleTime: 60_000,
  })
}

export function usePruneHyphae() {
  return useMutation({
    mutationFn: (threshold?: number) => settingsApi.pruneHyphae(threshold),
  })
}

export function useModes() {
  return useQuery({
    queryFn: () => settingsApi.getModes(),
    queryKey: settingsKeys.modes(),
    staleTime: 30_000,
  })
}

export function useActivateMode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mode: string) => settingsApi.activateMode(mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.modes() })
    },
  })
}
