import { createRouter, parseSearchWith, stringifySearchWith } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

// Use plain-string search param serialization (no JSON encoding).
// This keeps the URL human-readable and matches the URLSearchParams API
// used throughout the app via the useSearchParams compatibility shim.
const parseSearch = parseSearchWith((v) => v)
const stringifySearch = stringifySearchWith((v) => v)

export const router = createRouter({ parseSearch, routeTree, stringifySearch })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
