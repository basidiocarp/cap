import type { ExportedSymbol, RhizomeSymbol } from '../../lib/api'

export type CodeExplorerSymbolMode = 'all' | 'exports'

export interface CodeExplorerUrlState {
  file: string
  filter: string
  mode: CodeExplorerSymbolMode
  symbol: string
}

export const DEFAULT_CODE_EXPLORER_MODE: CodeExplorerSymbolMode = 'all'

export function parseCodeExplorerUrlState(searchParams: URLSearchParams): CodeExplorerUrlState {
  const mode = searchParams.get('mode')

  return {
    file: searchParams.get('file') ?? '',
    filter: searchParams.get('filter') ?? '',
    mode: mode === 'exports' ? 'exports' : DEFAULT_CODE_EXPLORER_MODE,
    symbol: searchParams.get('symbol') ?? '',
  }
}

export function writeCodeExplorerUrlState(current: URLSearchParams, state: CodeExplorerUrlState): URLSearchParams {
  const next = new URLSearchParams(current)

  if (state.file) {
    next.set('file', state.file)
  } else {
    next.delete('file')
  }

  if (state.symbol) {
    next.set('symbol', state.symbol)
  } else {
    next.delete('symbol')
  }

  if (state.filter) {
    next.set('filter', state.filter)
  } else {
    next.delete('filter')
  }

  if (state.mode !== DEFAULT_CODE_EXPLORER_MODE) {
    next.set('mode', state.mode)
  } else {
    next.delete('mode')
  }

  return next
}

export function toDisplaySymbols(
  symbols: RhizomeSymbol[],
  exports: ExportedSymbol[],
  selectedFile: string,
  mode: CodeExplorerSymbolMode
): RhizomeSymbol[] {
  if (mode !== 'exports') return symbols

  return exports.map((symbol) => ({
    doc_comment: null,
    kind: symbol.kind,
    location: {
      column_end: 0,
      column_start: 0,
      file_path: selectedFile,
      line_end: symbol.line,
      line_start: symbol.line,
    },
    name: symbol.name,
    signature: symbol.signature,
  }))
}
