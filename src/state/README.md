# State Ownership: TanStack Query vs Zustand

This document clarifies which state layer owns different types of data in Cap.

## Rule

- **TanStack Query owns**: API responses, ecosystem tool data, any data with a server-side source of truth.
  - Benefits: caching, deduplication, staleness management, automatic refetch on window focus.
  - Queries live in `src/lib/queries/`.
  
- **Zustand owns**: selected tab, panel collapse state, filter text, UI preferences, ephemeral form state, and any state with no server-side origin.
  - Benefits: simple local mutations, persistence to localStorage, easy subscription.
  - Stores live in `src/store/` and `src/stores/`.

## Violation Pattern

A Zustand store violates this ownership boundary if it:
- Imports from API modules or accepts data fetched via a query hook
- Is initialized or mutated with data returned from `useQuery`, `useQueries`, `useMutation`, or similar TanStack Query hooks
- Reads from a TanStack Query response and copies it into Zustand state

Example violation:
```typescript
// BAD: stores API-fetched graph nodes and edges
const useGraphData = () => {
  const { data } = useGraphQuery()
  const setGraphData = useMemoirGraphStore((state) => state.setGraphData)
  
  useEffect(() => {
    if (data) setGraphData(data.nodes, data.edges) // violation
  }, [data])
}
```

Correct pattern:
```typescript
// GOOD: use TanStack Query directly for the API data
const useGraphData = () => {
  const { data } = useGraphQuery() // no Zustand copy
  // derive UI state (like selectedNodeId) from Zustand
  const selectedNodeId = useMemoirGraphStore((state) => state.selectedNodeId)
}
```

## Current Stores

### ✅ Correct Usage

- **`src/store/annotations.ts`** — ReviewAnnotation list; review comment UI state, client-only ephemeral data
- **`src/store/host-coverage.ts`** — HostCoverageMode UI view preference, client-only; persisted to localStorage
- **`src/stores/dashboard-variant-store.ts`** — DashboardVariant UI preference ('operator', 'confident', 'fieldlab'), client-only; persisted to localStorage
- **`src/stores/memoir-graph-store.ts`** — currentNodeId and selectedMemoirName; UI selection state only

### ⚠️ Mixed / Migration Target

- **`src/store/project-context.ts`** — activeProject, pendingProject, recentProjects
  - ✅ `pendingProject` and UI transition state (isSwitchingProject) are client-only
  - ❌ `activeProject` and `recentProjects` appear to be server-derived and should live in a TanStack Query if they change server-side
  - Status: review for migration if project data becomes a query result

### ❌ Violation / High-Priority Migration

## Detecting Violations

Check for these patterns:

1. A store has a `use*Query()` hook call or imports from `src/lib/queries/`
2. A store receives data in its `set()` method that came from an API call
3. A component uses both `useQuery()` and the related Zustand store with the same data
4. The store's data changes when the server state changes (not just when the user interacts)

## Lint Convention

Until a custom Biome rule is available, mark stores that cross this boundary with a comment:

```typescript
// STATE-VIOLATION: stores server-derived data — migrate to TanStack Query
```

This comment should appear on the line before the `create(` call in any store that caches API responses.

## Migration Checklist

When migrating a store to TanStack Query:

1. Create or update a query hook in `src/lib/queries/` with the API call
2. Add stale time and cache time to match your invalidation needs
3. Remove the server data fields from the Zustand store
4. Keep any UI-only derived state (selection, mode, collapse) in Zustand
5. Update all consumers to use `useQuery()` for data and Zustand for UI state
6. Remove or inline the old Zustand store if it becomes empty
7. Run `npm test` and `npm run build` to verify no references remain
