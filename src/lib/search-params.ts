import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'

type SearchParamsUpdater =
  | URLSearchParams
  | Record<string, string>
  | ((prev: URLSearchParams) => URLSearchParams | Record<string, string>)

function toRecord(params: URLSearchParams | Record<string, string>): Record<string, string> {
  if (params instanceof URLSearchParams) {
    const obj: Record<string, string> = {}
    params.forEach((v, k) => { obj[k] = v })
    return obj
  }
  return params
}

// Drop-in replacement for react-router-dom's useSearchParams
export function useSearchParams(): [URLSearchParams, (updater: SearchParamsUpdater) => void] {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigate = useNavigate() as any

  // Stable reference: only a new object when the URL search string actually changes.
  // Without useMemo, every render produces a new URLSearchParams instance, which
  // makes useEffect([searchParams]) deps fire on every render → infinite loop.
  const params = useMemo(() => new URLSearchParams(searchStr), [searchStr])

  const setParams = useCallback(
    (updater: SearchParamsUpdater) => {
      navigate({
        search: (prev: unknown) => {
          // TanStack Router passes prev as a parsed Record, not a raw string.
          // Convert it back to URLSearchParams so updater functions can use .get()/.set().
          let prevParams: URLSearchParams
          if (prev instanceof URLSearchParams) {
            prevParams = prev
          } else if (typeof prev === 'string') {
            prevParams = new URLSearchParams(prev)
          } else if (prev && typeof prev === 'object') {
            prevParams = new URLSearchParams(
              Object.fromEntries(Object.entries(prev as Record<string, unknown>).map(([k, v]) => [k, String(v)]))
            )
          } else {
            prevParams = new URLSearchParams()
          }
          const next = typeof updater === 'function' ? updater(prevParams) : updater
          return toRecord(next)
        },
      })
    },
    [navigate]
  )

  return [params, setParams]
}
