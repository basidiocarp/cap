import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { lspApi } from '../api'

export const lspKeys = {
  install: (language: string) => ['lsp', 'install', language] as const,
  status: () => ['lsp', 'status'] as const,
}

export function useLspStatus() {
  return useQuery({
    queryFn: () => lspApi.status(),
    queryKey: lspKeys.status(),
    staleTime: 60_000,
  })
}

export function useLspInstall() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (language: string) => lspApi.install(language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lspKeys.status() })
    },
  })
}
