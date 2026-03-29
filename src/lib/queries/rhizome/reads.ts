import { useQuery } from '@tanstack/react-query'

import { rhizomeApi } from '../../api'
import { rhizomeKeys } from './keys'

export function useAnnotations(file: string, enabled = true) {
  return useQuery({
    enabled: !!file && enabled,
    queryFn: () => rhizomeApi.annotations(file),
    queryKey: rhizomeKeys.annotations(file),
    staleTime: 300_000,
  })
}

export function useComplexity(file: string, enabled = true) {
  return useQuery({
    enabled: !!file && enabled,
    queryFn: () => rhizomeApi.complexity(file),
    queryKey: rhizomeKeys.complexity(file),
    staleTime: 300_000,
  })
}

export function useDependencies(file: string, enabled = true) {
  return useQuery({
    enabled: !!file && enabled,
    queryFn: () => rhizomeApi.dependencies(file),
    queryKey: rhizomeKeys.dependencies(file),
  })
}

export function useSymbols(file: string, enabled = true) {
  return useQuery({
    enabled: !!file && enabled,
    queryFn: () => rhizomeApi.symbols(file),
    queryKey: rhizomeKeys.symbols(file),
    staleTime: 300_000,
  })
}

export function useDefinition(file: string, symbol: string) {
  return useQuery({
    enabled: !!file && !!symbol,
    queryFn: () => rhizomeApi.definition(file, symbol),
    queryKey: rhizomeKeys.definition(file, symbol),
    staleTime: 300_000,
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

export function useCallSites(file: string, fn?: string, enabled = true) {
  return useQuery({
    enabled: !!file && enabled,
    queryFn: () => rhizomeApi.callSites(file, fn),
    queryKey: rhizomeKeys.callSites(file, fn),
    staleTime: 300_000,
  })
}

export function useExports(file: string, enabled = true) {
  return useQuery({
    enabled: !!file && enabled,
    queryFn: () => rhizomeApi.exports(file),
    queryKey: rhizomeKeys.exports(file),
    staleTime: 300_000,
  })
}

export function useReferences(file: string, line: number, column: number, enabled = true) {
  return useQuery({
    enabled: !!file && line > 0 && column >= 0 && enabled,
    queryFn: () => rhizomeApi.references(file, line, column),
    queryKey: rhizomeKeys.references(file, line, column),
    staleTime: 300_000,
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

export function useTests(file: string, enabled = true) {
  return useQuery({
    enabled: !!file && enabled,
    queryFn: () => rhizomeApi.tests(file),
    queryKey: rhizomeKeys.tests(file),
    staleTime: 300_000,
  })
}
