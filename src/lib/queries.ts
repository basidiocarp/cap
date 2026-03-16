import { useQuery } from '@tanstack/react-query'

import { hyphaeApi, myceliumApi, rhizomeApi, statusApi } from './api'

// --- Hyphae ---

export const hyphaeKeys = {
  analytics: () => ['hyphae', 'analytics'] as const,
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

// --- Mycelium ---

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

// --- Rhizome ---

export const rhizomeKeys = {
  analytics: () => ['rhizome', 'analytics'] as const,
  definition: (file: string, symbol: string) => ['rhizome', 'definition', file, symbol] as const,
  diagnostics: (file?: string) => ['rhizome', 'diagnostics', file] as const,
  files: (path?: string, depth?: number) => ['rhizome', 'files', path, depth] as const,
  search: (pattern: string, path?: string) => ['rhizome', 'search', pattern, path] as const,
  status: () => ['rhizome', 'status'] as const,
  symbols: (file: string) => ['rhizome', 'symbols', file] as const,
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

// --- Status ---

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
