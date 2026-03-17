const BASE = '/api'

async function get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v)
    }
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

async function post<T = unknown>(path: string, body?: Record<string, unknown>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  const res = await fetch(url.toString(), {
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// Types (mirrors server/types.ts)

export interface Memory {
  id: string
  created_at: string
  updated_at: string
  last_accessed: string
  access_count: number
  weight: number
  topic: string
  summary: string
  raw_excerpt: string | null
  keywords: string
  importance: string
  source_type: string
  related_ids: string
}

export interface TopicSummary {
  topic: string
  count: number
  avg_weight: number
  newest: string
  oldest: string
}

export interface Stats {
  total_memories: number
  total_topics: number
  avg_weight: number
  oldest: string | null
  newest: string | null
}

export interface HealthResult {
  topic: string
  count: number
  avg_weight: number
  low_weight_count: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
}

export interface Memoir {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  consolidation_threshold: number
}

export interface Concept {
  id: string
  memoir_id: string
  name: string
  definition: string
  labels: string
  confidence: number
  revision: number
  created_at: string
  updated_at: string
  source_memory_ids: string
}

export interface ConceptLink {
  id: string
  source_id: string
  target_id: string
  relation: string
  weight: number
  created_at: string
}

export interface MemoirDetail {
  memoir: Memoir
  concepts: Concept[]
}

export interface ConceptNeighbor {
  concept: Concept
  link: ConceptLink
  direction: 'outgoing' | 'incoming'
}

export interface ConceptInspection {
  concept: Concept
  neighbors: ConceptNeighbor[]
}

export interface SymbolLocation {
  column_end: number
  column_start: number
  file_path: string
  line_end: number
  line_start: number
}

export interface RhizomeSymbol {
  children?: RhizomeSymbol[]
  doc_comment: string | null
  kind: string
  location: SymbolLocation
  name: string
  signature: string | null
}

export interface FileNode {
  children?: FileNode[]
  language?: string
  name: string
  path: string
  type: 'dir' | 'file'
}

export interface DiagnosticItem {
  code: string | null
  column: number
  file: string
  line: number
  message: string
  severity: 'error' | 'hint' | 'info' | 'warning'
}

export interface RhizomeStatus {
  available: boolean
  backend: 'lsp' | 'tree-sitter' | null
  languages: string[]
}

export interface LspInfo {
  available: boolean
  bin: string
  language: string
  name: string
  running: boolean
}

export interface EcosystemStatus {
  hyphae: { available: boolean; memories: number; memoirs: number; version: string | null }
  lsps: LspInfo[]
  mycelium: { available: boolean; version: string | null }
  rhizome: RhizomeStatus
}

export interface SearchResult {
  file: string
  kind: string
  line: number
  name: string
  signature: string | null
}

export interface SymbolDefinition {
  body: string
  doc_comment: string | null
  kind: string
  name: string
  signature: string | null
}

export interface HoverInfo {
  content: string
}

export interface Annotation {
  file: string
  kind: string
  line: number
  message: string
}

export interface ComplexityResult {
  complexity: number
  file: string
  line: number
  name: string
}

export interface DependencyEdge {
  callee: string
  caller: string
  line: number
}

export interface TestFunction {
  file: string
  line: number
  name: string
}

export interface HyphaeAnalytics {
  importance_distribution: { critical: number; ephemeral: number; high: number; low: number; medium: number }
  lifecycle: { avg_weight: number; created_last_7d: number; created_last_30d: number; decayed: number; min_weight: number; pruned: number }
  memoir_stats: { code_memoirs: number; total: number; total_concepts: number; total_links: number }
  memory_utilization: { rate: number; recalled: number; total: number }
  search_stats: { empty_results: number; hit_rate: number; total_searches: number }
  top_topics: { avg_weight: number; count: number; latest_created_at: string; name: string }[]
}

export interface MyceliumAnalytics {
  filter_hit_rate: { filtered: number; passthrough: number; rate: number }
  savings_by_category: { category: string; commands: number; rate: number; tokens_input: number; tokens_saved: number }[]
  savings_trend: { commands: number; date: string; tokens_saved: number }[]
  top_commands: { avg_savings_percent: number; command: string; count: number }[]
  total_stats: { overall_rate: number; total_commands: number; total_tokens_input: number; total_tokens_saved: number }
}

export interface RhizomeAnalytics {
  available: boolean
  backend_usage: { lsp: boolean; treesitter: boolean }
  languages: { detection: string; language: string }[]
  supported_tools: string[]
  tool_calls: { avg_duration_ms: number; count: number; tool: string }[]
}

export interface EcosystemSettings {
  hyphae: { config_path: string | null; db_path: string; db_size_bytes: number }
  mycelium: { config_path: string | null; filters: { hyphae: { enabled: boolean }; rhizome: { enabled: boolean } } }
  rhizome: { auto_export: boolean; config_path: string | null; languages_enabled: number }
}

export interface PruneResult {
  message: string
  pruned: number
}

export interface CallSite {
  call_expression: string
  caller: string
  file: string
  line: number
}

export interface EnclosingClass {
  kind: string
  line_end: number
  line_start: number
  name: string
}

export interface ExportedSymbol {
  kind: string
  line: number
  name: string
  signature: string | null
}

export interface FileSummary {
  description: string
  exports: number
  functions: number
  imports: number
  language: string
  lines: number
  types: number
}

export interface ParameterInfo {
  default_value: string | null
  name: string
  type: string | null
}

export interface ScopeVariable {
  kind: string
  line: number
  name: string
  type: string | null
}

export interface SymbolBody {
  body: string
  kind: string
  line_end: number
  line_start: number
  name: string
}

// API clients

export const hyphaeApi = {
  analytics: () => get<HyphaeAnalytics>('/hyphae/analytics'),
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
  stats: () => get<Stats>('/hyphae/stats'),
  topicMemories: (topic: string, limit?: number) =>
    get<Memory[]>(`/hyphae/topics/${encodeURIComponent(topic)}/memories`, { limit: limit ? String(limit) : '' }),
  topics: () => get<TopicSummary[]>('/hyphae/topics'),
}

export const myceliumApi = {
  analytics: () => get<MyceliumAnalytics>('/mycelium/analytics'),
  gain: () => get('/mycelium/gain'),
  gainHistory: () => get('/mycelium/gain/history'),
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
  status: () => get<RhizomeStatus>('/rhizome/status'),
  structure: (file: string, depth?: number) => get<RhizomeSymbol[]>('/rhizome/structure', { depth: depth ? String(depth) : '', file }),
  summary: (file: string) => get<FileSummary>('/rhizome/summary', { file }),
  symbolBody: (file: string, symbol: string, line?: number) =>
    get<SymbolBody>('/rhizome/symbol-body', { file, line: line ? String(line) : '', symbol }),
  symbols: (file: string) => get<RhizomeSymbol[]>('/rhizome/symbols', { file }),
  tests: (file: string) => get<TestFunction[]>('/rhizome/tests', { file }),
  typeDefinitions: (file: string) => get<RhizomeSymbol[]>('/rhizome/type-definitions', { file }),
}

export const settingsApi = {
  get: () => get<EcosystemSettings>('/settings'),
  pruneHyphae: (threshold?: number) => post<PruneResult>('/settings/hyphae/prune', threshold !== undefined ? { threshold } : undefined),
}

export const statusApi = {
  ecosystem: () => get<EcosystemStatus>('/status'),
}
