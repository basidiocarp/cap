# Changelog

## v0.9.0

### Features

- **Codex adapter status**: Status and onboarding now distinguish Claude lifecycle hooks, Codex MCP registration, and Codex notify adapter coverage instead of treating Claude hooks as the default integration model.
- **Codex-aware usage parsing**: Usage analytics now ingest Codex session transcripts and report Codex runtime/provider details more honestly.

### Improvements

- **Adapter-oriented runtime model**: Runtime health is now represented explicitly as host adapters, which makes Codex-first environments read as intentionally configured rather than partially broken.

## v0.8.0

### Features

- **Repair console onboarding**: The onboarding page now loads structured Stipe doctor/init reports and shows detected issues, planned init steps, and recommended repair actions.
- **Structured Stipe API**: Cap now exposes a repair-plan endpoint that consumes `stipe doctor --json` and `stipe init --dry-run --json`.

### Improvements

- **Action prioritization**: Onboarding actions now prefer Stipe-provided repair actions over fallback status heuristics.

## v0.7.0

### Features

- **Onboarding page**: New `/onboard` route with ecosystem setup guidance, suggested fix commands, and direct links back into the dashboard.
- **Stipe actions from the UI**: Allowlisted backend actions let the dashboard run safe `stipe` flows such as `doctor`, `init`, and profile-based installs.

### Improvements

- **Status page getting-started card**: Status now surfaces onboarding guidance directly when the ecosystem is partially configured.
- **Test-safe server bootstrap**: The backend no longer starts its HTTP listener during Vitest runs, which keeps tests isolated and deterministic.

## v0.4.0

### Features

- **Usage & Cost analytics tab**: Parses Claude Code session transcripts to estimate per-session and per-model token costs, with cost breakdown charts and trend analysis.
- **Agent telemetry backend**: New backend endpoints for collecting and querying agent performance metrics (latency, error rates, tool usage patterns).
- **Operational modes**: Settings page offers Explore, Develop, and Review modes that adjust dashboard layout and visible panels per workflow.
- **Force-graph visualization**: Interactive force-directed graph for memoir concepts on the Memoirs page, showing relationships and clusters.
- **ReactFlow ecosystem architecture diagram**: Visual architecture map on the Status page showing how Mycelium, Hyphae, Rhizome, Cap, Spore, and Lamella interconnect.
- **ReactFlow call graph**: Interactive call graph visualization in CodeExplorer showing function call relationships within a file.
- **Quick Context section on Dashboard**: At-a-glance panel showing recent memories, active sessions, and pending tasks.
- **Annotations and Complexity panels in CodeExplorer**: Side panels displaying code annotations (TODO/FIXME/NOTE) and cyclomatic complexity per function.
- **Cross-tool analytics**: 4-tab analytics layout (Mycelium token savings, Hyphae memory stats, Rhizome code intel, Usage & Cost) with unified date range filtering.
- **Settings page**: Tool configuration (binary paths, database locations), prune button for Hyphae memory cleanup, and operational mode selection.

## v0.3.0

### Features
- Error boundary wrapping all routes with retry button, prevents white-screen on chunk load failure
- LSP status detection on the Status page: shows installed and running language servers
- Shared `KpiCard` component for consistent metric cards across Dashboard and Analytics
- Keyboard utility (`onActivate`) for accessible interactive table rows
- Shared config module centralizing all binary paths and environment defaults

### Security
- Input validation on POST `/store`, `/consolidate`: rejects empty fields, validates importance against allowlist, type-checks keywords array
- Prune threshold validation: must be a finite number between 0 and 1
- Clamped `limit` (max 200) and `depth` (max 5) query parameters to prevent expensive queries
- NaN-safe numeric parameter parsing across all Rhizome route endpoints

### Improvements
- Converted blocking `execSync` to async in `/files` endpoint and LSP status checks
- Fixed `cachedAsync` thundering herd: concurrent cache misses now share a single in-flight promise
- Typed Mycelium CLI output: replaced 7 `as any` casts with `GainCliOutput` interface and type guard
- Typed `myceliumApi.gain()` return: added `GainResult` interface, removed untyped `unknown`
- API error messages now read server response body instead of generic HTTP status text
- Fixed `SectionCard` overflow: `overflow: visible` on card root prevents chart tooltip clipping
- Prevented silent `styles` override on `SectionCard` by excluding it from passthrough props
- Fixed `.sort()` mutation in Diagnostics: replaced with immutable `.toSorted()`
- Consolidated 5 color-mapping functions into `lib/colors.ts`, removed duplicates from pages
- Merged duplicate `defPreview`/`hasMoreLines` useMemo in CodeExplorer into single memo
- Dashboard uses shared `KpiCard` with accent colors and `h='100%'` for equal-height grid cards
- Nav sidebar supports sub-route highlighting via `startsWith` matching
- Diagnostics uses Mantine `ff='monospace'` instead of inline style
- Removed duplicate `PageLoader` from App.tsx, imports shared component
- Added `source_data` field to frontend `Memory` type to match backend `MemoryRow`
- Keyboard accessibility on clickable table rows across CodeExplorer, SymbolSearch, Diagnostics, and Memoirs
- Graceful shutdown calls `rhizome.destroy()` before closing database
- CORS origin configurable via `CORS_ORIGIN` environment variable
- Centralized `HYPHAE_BIN`, `MYCELIUM_BIN`, `RHIZOME_BIN` in shared config

## v0.2.0

### Features
- Rhizome integration: MCP client for code intelligence, persistent subprocess with JSON-RPC over stdio (`568ee98`)
- Code Explorer page (`/code`): two-panel file tree + symbol outline with definition preview
- Symbol Search page (`/symbols`): debounced global symbol search across project
- Diagnostics page (`/diagnostics`): LSP diagnostics grouped by file with severity badges
- Ecosystem Status page (`/status`): unified health for Mycelium, Hyphae, and Rhizome with auto-refresh
- Rhizome API routes: 9 endpoints proxying MCP tool calls (symbols, structure, definition, search, references, diagnostics, hover, files, status)
- Ecosystem status route: aggregated health from all three tools with 30s cache
- Analytics overhaul: Hyphae, Mycelium, and Rhizome data in a tabbed layout with ring progress charts (`a59ad5e`)
- Fungal color palette: 9 custom Mantine color tuples with semantic mappings
- Typography: Roboto body/headings, JetBrains Mono Variable monospace
- Sectioned sidebar navigation (Memory, Code, System)

### Improvements
- Page colors use ecosystem palette instead of hardcoded hex
- Theme system split into modules (colors, typography, shadows, spacing, interactions, tokens, components)
- Header subtitle: "memory dashboard" → "ecosystem dashboard"
- Mobile-responsive file tree with collapse toggle (`1e6d948`)

### Documentation
- Added `docs/design-choices.md` (color palette, typography, architecture)
- Updated `README.md`

### CI
- GitHub Actions CI workflow (`deb7d9e`)

## v0.1.0

### Features
- Initial cap dashboard with Hyphae SQLite integration (`d740aac`)

### Chores
- Biome lint fixes and config migration to v2.4.6 (`86b4408`)
