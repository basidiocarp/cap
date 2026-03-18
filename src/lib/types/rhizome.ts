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

export interface LspInfo {
  available: boolean
  bin: string
  language: string
  name: string
  running: boolean
}

export interface RhizomeAnalytics {
  available: boolean
  backend_usage: { lsp: boolean; treesitter: boolean }
  languages: { detection: string; language: string }[]
  supported_tools: string[]
  tool_calls: { avg_duration_ms: number; count: number; tool: string }[]
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

export interface RhizomeStatus {
  available: boolean
  backend: 'lsp' | 'tree-sitter' | null
  languages: string[]
}

export interface ProjectInfo {
  active: string
  recent: string[]
}
