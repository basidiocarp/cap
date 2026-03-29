import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useProjectContextStore } from '../../../store/project-context'
import { rhizomeApi } from '../../api'
import { rhizomeKeys } from './keys'

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

function invalidateRhizomeQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return () => {
    queryClient.invalidateQueries({ queryKey: ['rhizome'] })
  }
}

export function useRenameSymbol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof rhizomeApi.renameSymbol>[0]) => rhizomeApi.renameSymbol(body),
    onSuccess: invalidateRhizomeQueries(queryClient),
  })
}

export function useCopySymbol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof rhizomeApi.copySymbol>[0]) => rhizomeApi.copySymbol(body),
    onSuccess: invalidateRhizomeQueries(queryClient),
  })
}

export function useMoveSymbol() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof rhizomeApi.moveSymbol>[0]) => rhizomeApi.moveSymbol(body),
    onSuccess: invalidateRhizomeQueries(queryClient),
  })
}
