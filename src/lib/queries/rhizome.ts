import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useProjectContextStore } from '../../store/project-context'
import { rhizomeApi } from '../api'

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
  project: () => ['rhizome', 'project'] as const,
  references: (file: string, line: number, column: number) => ['rhizome', 'references', file, line, column] as const,
  scope: (file: string, line: number) => ['rhizome', 'scope', file, line] as const,
  search: (pattern: string, path?: string) => ['rhizome', 'search', pattern, path] as const,
  status: () => ['rhizome', 'status'] as const,
  summary: (file: string) => ['rhizome', 'summary', file] as const,
  symbolBody: (file: string, symbol: string, line?: number) => ['rhizome', 'symbolBody', file, symbol, line] as const,
  symbols: (file: string) => ['rhizome', 'symbols', file] as const,
  tests: (file: string) => ['rhizome', 'tests', file] as const,
  typeDefinitions: (file: string) => ['rhizome', 'typeDefinitions', file] as const,
}

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

export function useRhizomeStatus() {
  return useQuery({
    queryFn: () => rhizomeApi.status(),
    queryKey: rhizomeKeys.status(),
    staleTime: 30_000,
  })
}

export function useProject() {
  const syncProject = useProjectContextStore((state) => state.syncProject)
  const query = useQuery({
    queryFn: () => rhizomeApi.project(),
    queryKey: rhizomeKeys.project(),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (query.data) {
      syncProject(query.data)
    }
  }, [query.data, syncProject])

  return query
}

export function useSwitchProject() {
  const queryClient = useQueryClient()
  const failProjectSwitch = useProjectContextStore((state) => state.failProjectSwitch)
  const finishProjectSwitch = useProjectContextStore((state) => state.finishProjectSwitch)
  const startProjectSwitch = useProjectContextStore((state) => state.startProjectSwitch)

  return useMutation({
    mutationFn: (path: string) => rhizomeApi.switchProject(path),
    onError: () => {
      failProjectSwitch()
    },
    onMutate: (path) => {
      startProjectSwitch(path)
    },
    onSuccess: (project) => {
      finishProjectSwitch(project)
      queryClient.setQueryData(rhizomeKeys.project(), project)
      queryClient.invalidateQueries({ queryKey: ['rhizome'] })
      queryClient.invalidateQueries({ queryKey: ['status'] })
    },
  })
}

export function useRenameSymbol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof rhizomeApi.renameSymbol>[0]) => rhizomeApi.renameSymbol(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rhizome'] })
    },
  })
}

export function useCopySymbol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof rhizomeApi.copySymbol>[0]) => rhizomeApi.copySymbol(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rhizome'] })
    },
  })
}

export function useMoveSymbol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof rhizomeApi.moveSymbol>[0]) => rhizomeApi.moveSymbol(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rhizome'] })
    },
  })
}

export function useFileTree(path?: string, depth?: number) {
  return useQuery({
    queryFn: () => rhizomeApi.files(path, depth),
    queryKey: rhizomeKeys.files(path, depth),
    staleTime: 60_000,
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

export function useRhizomeAnalytics(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => rhizomeApi.analytics(),
    queryKey: rhizomeKeys.analytics(),
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
