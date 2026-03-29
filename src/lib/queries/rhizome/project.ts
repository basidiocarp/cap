import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useProjectContextStore } from '../../../store/project-context'
import { rhizomeApi } from '../../api'
import { rhizomeKeys } from './keys'

export function useRhizomeStatus() {
  return useQuery({
    queryFn: () => rhizomeApi.status(),
    queryKey: rhizomeKeys.status(),
    staleTime: 30_000,
  })
}

export function useProject() {
  return useQuery({
    queryFn: () => rhizomeApi.project(),
    queryKey: rhizomeKeys.project(),
    staleTime: 30_000,
  })
}

export function useProjectContextController() {
  const syncProject = useProjectContextStore((state) => state.syncProject)
  const query = useProject()

  useEffect(() => {
    if (query.data) {
      syncProject(query.data)
    }
  }, [query.data, syncProject])

  return query
}

export function useRhizomeAnalytics(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => rhizomeApi.analytics(),
    queryKey: rhizomeKeys.analytics(),
  })
}

export function useFileTree(path?: string, depth?: number) {
  return useQuery({
    queryFn: () => rhizomeApi.files(path, depth),
    queryKey: rhizomeKeys.files(path, depth),
    staleTime: 60_000,
  })
}
