import type {
  AggregateTelemetry,
  Annotation,
  CallSite,
  CommandHistory,
  ComplexityResult,
  Concept,
  ConceptInspection,
  DependencyEdge,
  DiagnosticItem,
  EcosystemSettings,
  EcosystemStatus,
  EnclosingClass,
  ExportedSymbol,
  FileNode,
  FileSummary,
  GainResult,
  GatherContextResult,
  HealthResult,
  HoverInfo,
  HyphaeAnalytics,
  IngestionSource,
  Lesson,
  LspInstallResult,
  LspStatusResult,
  Memoir,
  MemoirDetail,
  Memory,
  ModeConfig,
  MyceliumAnalytics,
  ParameterInfo,
  ProjectInfo,
  PruneResult,
  RhizomeAnalytics,
  RhizomeStatus,
  RhizomeSymbol,
  ScopeVariable,
  SearchResult,
  SessionRecord,
  SessionUsage,
  Stats,
  SymbolBody,
  SymbolDefinition,
  SymbolLocation,
  TestFunction,
  TopicSummary,
  UsageAggregate,
  UsageTrend,
} from './types'
import type { AllowedStipeAction } from './onboarding'

// Re-export all types for backward compatibility
export type {
  Annotation,
  CallSite,
  CommandHistory,
  CommandHistoryEntry,
  ComplexityResult,
  Concept,
  ConceptInspection,
  ConceptLink,
  ConceptNeighbor,
  ContextEntry,
  DependencyEdge,
  DiagnosticItem,
  EcosystemSettings,
  EcosystemStatus,
  EnclosingClass,
  ExportedSymbol,
  FileNode,
  FileSummary,
  GainResult,
  GatherContextResult,
  HealthResult,
  HoverInfo,
  HyphaeAnalytics,
  IngestionSource,
  LspInfo,
  LspInstallResult,
  LspLanguageStatus,
  LspStatusResult,
  Memoir,
  MemoirDetail,
  Memory,
  Mode,
  ModeConfig,
  MyceliumAnalytics,
  ParameterInfo,
  ProjectInfo,
  PruneResult,
  RhizomeAnalytics,
  RhizomeStatus,
  RhizomeSymbol,
  ScopeVariable,
  Lesson,
  SearchResult,
  SessionRecord,
  SessionUsage,
  Stats,
  SymbolBody,
  SymbolDefinition,
  SymbolLocation,
  TestFunction,
  TopicSummary,
  UsageAggregate,
  UsageTrend,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// HTTP client
// ─────────────────────────────────────────────────────────────────────────────

const BASE = '/api'

function getOrigin(): string {
  return (globalThis as { location?: { origin?: string } }).location?.origin ?? 'http://localhost'
}

async function extractErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => null)
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error
  }
  return `${res.status} ${res.statusText}`
}

async function get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`, getOrigin())
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v)
    }
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(await extractErrorMessage(res))
  return res.json() as Promise<T>
}

async function post<T = unknown>(path: string, body?: Record<string, unknown>): Promise<T> {
  const url = new URL(`${BASE}${path}`, getOrigin())
  const res = await fetch(url.toString(), {
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) throw new Error(await extractErrorMessage(res))
  return res.json() as Promise<T>
}

async function put<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = new URL(`${BASE}${path}`, getOrigin())
  const res = await fetch(url.toString(), {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  })
  if (!res.ok) throw new Error(await extractErrorMessage(res))
  return res.json() as Promise<T>
}

// ─────────────────────────────────────────────────────────────────────────────
// API clients
// ─────────────────────────────────────────────────────────────────────────────

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
  deleteMemory: (id: string) => {
    const url = new URL(`${BASE}/hyphae/memories/${encodeURIComponent(id)}`, getOrigin())
    return fetch(url.toString(), { method: 'DELETE' }).then(async (res) => {
      if (!res.ok) throw new Error(await extractErrorMessage(res))
      return res.json() as Promise<{ result: string }>
    })
  },
  health: (topic?: string) => get<HealthResult[]>('/hyphae/health', { topic: topic ?? '' }),
  memoir: (name: string) => get<MemoirDetail>(`/hyphae/memoirs/${encodeURIComponent(name)}`),
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
  sources: () => get<IngestionSource[]>('/hyphae/sources'),
  stats: () => get<Stats>('/hyphae/stats'),
  topicMemories: (topic: string, limit?: number) =>
    get<Memory[]>(`/hyphae/topics/${encodeURIComponent(topic)}/memories`, { limit: limit ? String(limit) : '' }),
  topics: () => get<TopicSummary[]>('/hyphae/topics'),
  updateImportance: (id: string, importance: string) =>
    put<{ result: string }>(`/hyphae/memories/${encodeURIComponent(id)}/importance`, { importance }),
  sessions: (project?: string, limit?: number) =>
    get<SessionRecord[]>('/hyphae/sessions', { limit: limit ? String(limit) : '', project: project ?? '' }),
  lessons: () => get<Lesson[]>('/hyphae/lessons'),
}

export const myceliumApi = {
  analytics: () => get<MyceliumAnalytics>('/mycelium/analytics'),
  commandHistory: (limit?: number) => get<CommandHistory>('/mycelium/history', { limit: limit ? String(limit) : '' }),
  gain: () => get<GainResult>('/mycelium/gain'),
  gainHistory: () => get<GainResult>('/mycelium/gain/history'),
}

export const rhizomeApi = {
  analytics: () => get<RhizomeAnalytics>('/rhizome/analytics'),
  annotations: (file: string) => get<Annotation[]>('/rhizome/annotations', { file }),
  callSites: (file: string, fn?: string) => get<CallSite[]>('/rhizome/call-sites', { file, function: fn ?? '' }),
  complexity: (file: string) => get<ComplexityResult[]>('/rhizome/complexity', { file }),
  definition: (file: string, symbol: string) => get<SymbolDefinition>('/rhizome/definition', { file, symbol }),
  dependencies: (file: string) => get<DependencyEdge[]>('/rhizome/dependencies', { file }),
  diagnostics: (file?: string) => get<DiagnosticItem[]>('/rhizome/diagnostics', { file: file ?? '' }),
  enclosingClass: (file: string, line: number) => get<EnclosingClass>('/rhizome/enclosing-class', { file, line: String(line) }),
  exports: (file: string) => get<ExportedSymbol[]>('/rhizome/exports', { file }),
  files: (path?: string, depth?: number) => get<FileNode[]>('/rhizome/files', { depth: depth ? String(depth) : '', path: path ?? '' }),
  hover: (file: string, line: number, column: number) =>
    get<HoverInfo>('/rhizome/hover', { column: String(column), file, line: String(line) }),
  parameters: (file: string, symbol: string) => get<ParameterInfo[]>('/rhizome/parameters', { file, symbol }),
  references: (file: string, line: number, column: number) =>
    get<SymbolLocation[]>('/rhizome/references', { column: String(column), file, line: String(line) }),
  scope: (file: string, line: number) => get<ScopeVariable[]>('/rhizome/scope', { file, line: String(line) }),
  search: (pattern: string, path?: string) => get<SearchResult[]>('/rhizome/search', { path: path ?? '', pattern }),
  project: () => get<ProjectInfo>('/rhizome/project'),
  status: () => get<RhizomeStatus>('/rhizome/status'),
  switchProject: (path: string) => post<ProjectInfo>('/rhizome/project', { path }),
  structure: (file: string, depth?: number) => get<RhizomeSymbol[]>('/rhizome/structure', { depth: depth ? String(depth) : '', file }),
  summary: (file: string) => get<FileSummary>('/rhizome/summary', { file }),
  symbolBody: (file: string, symbol: string, line?: number) =>
    get<SymbolBody>('/rhizome/symbol-body', { file, line: line ? String(line) : '', symbol }),
  symbols: (file: string) => get<RhizomeSymbol[]>('/rhizome/symbols', { file }),
  tests: (file: string) => get<TestFunction[]>('/rhizome/tests', { file }),
  typeDefinitions: (file: string) => get<RhizomeSymbol[]>('/rhizome/type-definitions', { file }),
}

export const usageApi = {
  aggregate: () => get<UsageAggregate>('/usage'),
  sessions: (since?: string, limit?: number) =>
    get<SessionUsage[]>('/usage/sessions', { limit: limit ? String(limit) : '', since: since ?? '' }),
  telemetry: () => get<AggregateTelemetry>('/telemetry'),
  trend: (days?: number) => get<UsageTrend[]>('/usage/trend', { days: days ? String(days) : '' }),
}

export const settingsApi = {
  activateMode: (mode: string) => post<ModeConfig>('/settings/modes/activate', { mode }),
  get: () => get<EcosystemSettings>('/settings'),
  getModes: () => get<ModeConfig>('/settings/modes'),
  pruneHyphae: (threshold?: number) => post<PruneResult>('/settings/hyphae/prune', threshold !== undefined ? { threshold } : undefined),
  updateHyphae: (config: { embedding_model?: string; similarity_threshold?: number }) => put<EcosystemSettings>('/settings/hyphae', config),
  updateMycelium: (config: { hyphae_enabled?: boolean; rhizome_enabled?: boolean }) => put<EcosystemSettings>('/settings/mycelium', config),
  updateRhizome: (config: { auto_export?: boolean; languages?: string[] }) => put<EcosystemSettings>('/settings/rhizome', config),
}

export const lspApi = {
  install: (language: string) => post<LspInstallResult>('/lsp/install', { language }),
  status: () => get<LspStatusResult>('/lsp/status'),
}

export const statusApi = {
  ecosystem: () => get<EcosystemStatus>('/status'),
}

export interface StipeRunResult {
  action: AllowedStipeAction
  command: string
  output: string
}

export const stipeApi = {
  run: (action: AllowedStipeAction) => post<StipeRunResult>('/settings/stipe/run', { action }),
}
