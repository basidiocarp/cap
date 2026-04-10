import { useQuery } from '@tanstack/react-query'

import { sessionsApi } from '../api'

export const sessionsKeys = {
  timeline: (sessionId: string) => ['sessions', 'timeline', sessionId] as const,
}

export function useSessionTimelineEvents(sessionId: string) {
  return useQuery({
    enabled: !!sessionId,
    queryFn: () => sessionsApi.timeline(sessionId),
    queryKey: sessionsKeys.timeline(sessionId),
  })
}
