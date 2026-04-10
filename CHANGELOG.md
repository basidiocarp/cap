# Changelog

All notable changes to Cap are documented in this file.

## [Unreleased]

## [0.11.2] - 2026-04-09

### Added

- **Session detail API**: Cap now exposes dedicated Hyphae session-detail
  routes and server-side helpers for timeline inspection.

### Changed

- **Session timeline UI**: The sessions experience now renders richer event
  detail, stronger detail-modal utilities, and dedicated client-side session
  query helpers.
- **Docs structure**: The docs set now uses the lowercase path layout with a
  central `docs/README.md` and plan index.

## [0.11.1] - 2026-04-05

### Fixed

- **Cap auth and write boundaries**: The API no longer fails open when
  `CAP_API_KEY` is unset, settings writes reject malformed payloads earlier, and
  Rhizome project switching now enforces the configured project boundary.
- **Analytics and status fidelity**: Usage, code-intelligence, and memory-health
  views now present cross-tool state more honestly, session lifecycle badges use
  stable keys, and analytics charts use safer sizing defaults.
- **Session timeline detail**: Cap now exposes a per-session timeline route and
  renders detailed session events with chronology, typed event treatment, and
  cleaner empty states.
- **Mobile navigation accessibility**: The mobile nav toggle is now a real
  button with ARIA state and keyboard interaction.
- **Tooling coverage**: Biome now includes config TypeScript files,
  `vitest.frontend.config.ts` is part of node-side TS coverage, and `lint:check`
  provides a non-mutating lint gate.

### Changed

- **Contributor docs cleanup**: `.gitignore` now covers `.claude/`, the API and
  getting-started docs were refreshed, and `INTERNALS.md` moved into `docs/`.
- **Dashboard guidance and framing**: Empty states, host-coverage wording, and
  ecosystem boundary docs were updated so Cap describes Claude Code and Codex
  support more accurately.

## [0.11.0] - 2026-03-31

### Added

- **Owned ecosystem reads**: Cap now consumes owned Hyphae, Mycelium, Canopy,
  and Stipe command surfaces instead of reconstructing those views from private
  storage.
- **Live contract coverage**: Added real Cap-to-Hyphae and Cap-to-Mycelium
  contract tests that execute the actual binaries and pin the argv and JSON
  seams.

### Changed

- **Versioned contract enforcement**: Server adapters now require published
  `schema_version` fields across the main Hyphae, Mycelium, Canopy, and Stipe
  boundaries.
- **Session identity joins**: Session pages now prefer shared runtime-session
  ids and identity-v1 data when correlating Hyphae and Mycelium activity.
- **Fail-closed dashboard reads**: Status, analytics, context, memoirs,
  lessons, and timeline reads now stop on contract errors instead of leaning on
  private storage shapes.

## [0.10.0] - 2026-03-23

### Added

- **Codex-first onboarding**: Onboarding now presents a single Codex-oriented
  path with required Codex work separated from optional Claude-specific setup.

### Changed

- **Codex mode summaries**: Status and onboarding now explain whether Codex mode
  is ready, partial, or needs repair.
- **Action ordering**: The Codex install profile and notify-adapter
  requirements now appear ahead of Claude-specific follow-up steps.

## [0.9.0] - 2026-03-23

### Added

- **Codex adapter status**: Status and onboarding now distinguish Claude
  lifecycle hooks, Codex MCP registration, and Codex notify coverage.
- **Codex-aware usage parsing**: Usage analytics now ingest Codex session
  transcripts and report Codex runtime and provider details more honestly.

### Changed

- **Adapter-oriented runtime model**: Runtime health is now represented
  explicitly as host adapters, which makes Codex-first environments look
  intentionally configured instead of half broken.

## [0.8.0] - 2026-03-22

### Added

- **Repair console onboarding**: The onboarding page now loads structured Stipe
  doctor and init reports and shows detected issues, planned steps, and repair
  actions.
- **Structured Stipe API**: Cap now exposes a repair-plan endpoint backed by
  `stipe doctor --json` and `stipe init --dry-run --json`.

### Changed

- **Action prioritization**: Onboarding actions now prefer Stipe-provided repair
  actions over Cap-side fallback heuristics.

## [0.7.0] - 2026-03-22

### Added

- **Onboarding page**: Added `/onboard` with ecosystem setup guidance,
  suggested fix commands, and links back into the dashboard.
- **Stipe actions from the UI**: Allowlisted backend actions can now run safe
  `stipe` flows such as `doctor`, `init`, and profile-based installs.

### Changed

- **Status getting-started card**: Status now surfaces onboarding guidance
  directly when the ecosystem is only partially configured.
- **Test-safe bootstrap**: The backend no longer starts its HTTP listener during
  Vitest runs.

## [0.4.0] - 2026-03-19

### Added

- **Usage and cost analytics**: Cap can now estimate per-session and per-model
  token cost from Claude Code transcripts.
- **Agent telemetry backend**: Added backend endpoints for latency, error-rate,
  and tool-usage metrics.
- **Operational modes**: The settings page now offers Explore, Develop, and
  Review layouts.
- **Graph visualizations**: Memoirs, ecosystem architecture, and CodeExplorer
  call graphs now have interactive graph views.
- **Quick context panel**: The dashboard now shows recent memories, active
  sessions, and pending tasks at a glance.
- **CodeExplorer side panels**: Added annotations and cyclomatic-complexity
  panels.
- **Cross-tool analytics tabs**: Analytics now combines Mycelium, Hyphae,
  Rhizome, and usage-cost views behind one date range filter.
- **Settings page**: Added tool configuration, Hyphae prune controls, and mode
  selection.

## [0.3.0] - 2026-03-18

### Added

- **Error boundary**: All routes now sit behind a retryable error boundary to
  prevent white-screen failures.
- **LSP status page**: The status page now shows installed and running language
  servers.
- **Shared KPI cards**: Dashboard and analytics metric cards now use one common
  component.
- **Keyboard activation helper**: Clickable table rows now have shared keyboard
  activation support.
- **Shared config module**: Binary paths and environment defaults now resolve
  from one place.

### Changed

- **Async backend reads**: Blocking `execSync` calls were removed from `/files`
  and LSP status checks.
- **Typed Mycelium integration**: Gain output and related frontend contracts now
  use typed interfaces instead of `any`.
- **UI polish**: SectionCard overflow, color mapping, duplicate memo logic,
  sidebar highlighting, and shared loading components were cleaned up.
- **Graceful shutdown**: Cap now destroys the Rhizome client before closing the
  database.
- **Centralized binary config**: `HYPHAE_BIN`, `MYCELIUM_BIN`, and
  `RHIZOME_BIN` now live in shared config.

### Security

- **Input validation**: POST `/store` and `/consolidate` now reject empty
  fields, validate importance, and type-check keywords.
- **Query clamps**: `limit` and `depth` query parameters now cap expensive
  requests.
- **Safer numeric parsing**: Rhizome route parameters now reject NaN and related
  malformed numeric input.

## [0.2.0] - 2026-03-16

### Added

- **Rhizome integration**: Added a persistent MCP client for code intelligence
  over JSON-RPC stdio.
- **Code Explorer**: Added the `/code` route with a file tree, symbol outline,
  and definition preview.
- **Symbol Search**: Added debounced project-wide symbol search.
- **Diagnostics page**: Added grouped LSP diagnostics with severity badges.
- **Ecosystem Status**: Added a unified health page for Mycelium, Hyphae, and
  Rhizome with auto-refresh.
- **Rhizome API routes**: Added proxy endpoints for symbols, structure,
  definition, search, references, diagnostics, hover, files, and status.
- **Analytics overhaul**: Hyphae, Mycelium, and Rhizome data now live in a
  tabbed analytics layout.
- **Visual system**: Added the fungal palette, typography system, and sectioned
  sidebar navigation.

### Changed

- **Theme modularization**: Colors, typography, shadows, spacing,
  interactions, tokens, and components were split into dedicated theme modules.
- **Ecosystem branding**: The header subtitle now reads as an ecosystem
  dashboard instead of only a memory dashboard.
- **Mobile file tree**: The file tree now collapses cleanly on smaller screens.

## [0.1.0] - 2026-03-11

### Added

- **Initial dashboard**: Cap shipped as a dashboard on top of Hyphae SQLite
  data.

### Changed

- **Frontend tooling**: Biome lint fixes and the config migration to v2.4.6
  landed with the initial public release.
