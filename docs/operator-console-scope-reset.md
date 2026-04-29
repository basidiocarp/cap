# Cap Operator Console Scope Reset

> Decision report — produced 2026-04-29. Audit only; no implementation changes.

---

## Executive Decision

**Partial rebuild, phased.**

Cap is a functional operator console today, but it has overreached in two directions: it hosts code-intelligence surfaces (code explorer, symbol search, LSP management) that belong in rhizome, and it holds several premature surfaces (watchers, telemetry file scan) with no active consumer. Core operator surfaces — status, Canopy task view, sessions timeline, diagnostics, settings, and memory read/write — are stable and ready for dogfood with minimal work.

The recommended path is:

1. Accept the report and freeze new feature additions.
2. Cut the code-intelligence and premature surfaces now.
3. Migrate CLI couplings to typed contracts as sibling endpoints land (already sequenced in C7/C8).
4. Rebuild the telemetry and raw-session-scan surfaces from hyphae/cortina contracts once those land.

---

## Operator Role

**Cap owns:**
- Read-only views of ecosystem state (status, session activity, memory/memoir data, Canopy task state)
- Operator repair/action surfaces (task actions, handoff actions, memory forget/consolidate, notification management)
- Budget and cost tracking (Cap-owned SQLite, no sibling coupling)
- Settings management (config reads and writes through hyphae and platform discovery)

**Cap does not own:**
- Code intelligence or code navigation — that is rhizome's surface
- LSP server lifecycle — rhizome owns language server management
- Session transcript parsing — hyphae owns session data; raw JSONL scans are fragile and create implicit coupling to Claude/Codex internal file formats
- Telemetry aggregation — cortina captures lifecycle signals; Cap should consume a cortina or hyphae endpoint, not walk the file tree
- Workflow orchestration — task state flows through canopy, not through Cap

---

## Route Inventory

| Route | Current purpose | Data source | Dogfood value | Classification | Notes |
|-------|----------------|-------------|---------------|----------------|-------|
| `/` | Summary dashboard tiles | Multiple APIs | High | keep-for-dogfood | Tile composition may need pruning as surfaces are cut |
| `/memories` | Hyphae memory browser | `/api/hyphae` (CLI) | Medium | keep-contract-migrate | Useful operator surface; hyphae CLI coupling needs versioned contract |
| `/memoirs` | Hyphae memoir graph browser | `/api/hyphae` (CLI) | Medium | keep-contract-migrate | Same migration path as `/memories` |
| `/sessions` | Session timeline viewer | `/api/sessions` (hyphae CLI + cap DB) | High | keep-for-dogfood | Primary post-session review surface; CLI coupling is migration target |
| `/lessons` | Hyphae-extracted lessons | `/api/hyphae` (CLI) | Low | defer | Useful eventually; no dogfood demand yet; depends on hyphae lesson extraction maturing |
| `/onboard` | First-run setup guide | Static / settings | High | keep-for-dogfood | Required for new installs; no backend coupling issues |
| `/canopy` | Task and handoff viewer | `/api/canopy` (canopy DB + CLI) | High | keep-for-dogfood | Core operator console purpose; direct DB read is intentional and agreed (C7/C8) |
| `/analytics` | Mycelium token gain stats | `/api/mycelium` (CLI) | Medium | keep-contract-migrate | Operator metric; mycelium CLI coupling is migration target |
| `/code` | Code symbol browser | `/api/rhizome` (MCP spawn) | Low | cut | Code intelligence is rhizome's surface; Cap should not own this view |
| `/diagnostics` | Ecosystem diagnostics | `/api/status` | High | keep-for-dogfood | Squarely operator console; keep as-is |
| `/settings` | Config management | `/api/settings` (hyphae CLI + platform) | High | keep-for-dogfood | Required operator surface; CLI coupling is migration target |
| `/status` | Ecosystem health panel | `/api/status` (multiple CLIs + platform) | High | keep-for-dogfood | Core operator view; CLI probes are acceptable at this layer for now |
| `/symbols` | Symbol search | `/api/rhizome` (MCP spawn) | Low | cut | Code intelligence surface; does not belong in operator console |

---

## API Inventory

| API namespace | Current source | Contract-backed? | CLI/DB dependency | Classification | Notes |
|---------------|---------------|-----------------|-------------------|----------------|-------|
| `/api/canopy` | `server/canopy.ts` | Partial — notifications and snapshot have informal shape | canopy DB (direct read/write) + canopy CLI for mutations | keep-for-dogfood | Direct DB read is an approved operator-console pattern (C7/C8); mutations should migrate to canopy typed endpoint when available (C8 stub) |
| `/api/cost` | `server/lib/capDb.ts` | No septa schema yet | cap-owned SQLite | keep-for-dogfood | Clean: cap owns cost/budget state; no sibling coupling; add a septa schema when shape stabilises |
| `/api/ecosystem` | `server/annulus.ts` | No | annulus CLI | keep-for-dogfood → keep-contract-migrate | Annulus status is legitimate operator data; CLI coupling should migrate to annulus typed endpoint |
| `/api/hyphae` | `server/hyphae/` | Partial — `hyphae-activity-v1`, `hyphae-analytics-v1`, `hyphae-lessons-v1`, `hyphae-session-timeline-v1` exist in septa | hyphae CLI throughout (reads and writes) | keep-contract-migrate | Most reads have septa schemas; CLI coupling is the primary migration target; writes (store, forget, consolidate) are direct MCP tool calls — should stay that way |
| `/api/lsp` | `server/routes/lsp.ts` | No | rhizome CLI (`lsp` subcommand) | rebuild-after-contracts | LSP lifecycle belongs to rhizome; cut this namespace once rhizome exposes a proper LSP management surface |
| `/api/mycelium` | `server/mycelium/` | No septa schema for gain/analytics output | mycelium CLI | keep-contract-migrate | Token metrics are legitimate operator data; CLI coupling is migration target per C7/C8 |
| `/api/sessions` | `server/routes/sessions.ts` | Partial — `hyphae-session-timeline-v1` exists | hyphae CLI + cap DB (conversation_id mapping) | keep-for-dogfood | Session timeline is core; conversation_id mapping in cap DB is legitimate; CLI coupling is migration target |
| `/api/rhizome` | `server/rhizome/` | No | rhizome long-lived MCP spawn + rhizome CLI | cut | Code intelligence reads and edits should not be proxied through Cap; long-lived rhizome process managed by Cap is accidental orchestration |
| `/api/settings` | `server/routes/settings/` | No septa schema for hyphae config shape | hyphae CLI + stipe CLI + platform discovery | keep-for-dogfood | Config management is operator surface; hyphae and stipe CLI coupling is migration target |
| `/api/status` | `server/routes/status/` | No | mycelium CLI, hyphae CLI, annulus CLI, platform process detection | keep-for-dogfood | Status aggregation is exactly the operator console job; CLI probes are acceptable for version/availability checks; migrate to typed endpoints as they land |
| `/api/telemetry` | `server/routes/telemetry.ts` | No | direct filesystem scan (local telemetry dir) | rebuild-after-contracts | File scan is fragile and format-coupled to Claude internal telemetry layout; cortina should own this data pipeline; rebuild once cortina emits structured events |
| `/api/usage` | `server/routes/usage.ts` | No | direct JSONL scan of Claude and Codex transcript directories | rebuild-after-contracts | Fragile: format-coupled to Claude `.jsonl` internal layout; hyphae already owns session data; rebuild using `hyphae-session-timeline-v1` or a new hyphae usage endpoint |
| `/api/watchers` | `server/routes/watchers.ts` | No | cap-internal watcher registry (webhook + GitHub adapters) | defer | No active consumer; webhook receiver is useful in future but premature now; defer until there is a concrete integration need |

---

## Screen Classification Summary

**keep-for-dogfood**
- Dashboard, Sessions, Onboard, Canopy, Diagnostics, Settings, Status

**keep-contract-migrate**
- Memories, Memoirs, Analytics

**cut**
- CodeExplorer (`/code`), SymbolSearch (`/symbols`)

**rebuild-after-contracts**
- (no front-end screens in this category — the rebuild targets are server-side: `/api/telemetry`, `/api/usage`)

**defer**
- Lessons

---

## Split Assessment

**Keep one repo.** The current `server/` + `src/` split within the cap repo is well-structured. The surfaces that need to be removed (`/code`, `/symbols`, `/api/rhizome`, `/api/lsp`) are bounded to specific route files and a single long-lived MCP client. A full client/server repo split adds coordination cost without solving the real problem, which is surface scope, not package boundaries.

If volva eventually takes over the orchestration host role, Cap's server layer may thin out significantly — at that point a repo split or server-removal could be revisited. Not now.

---

## Rebuild Plan

The smallest first slice, in order:

1. **Cut** `/code`, `/symbols` front-end routes and remove `/api/rhizome` (including the long-lived rhizome spawn in `rhizome/client.ts`) and `/api/lsp`. No replacement needed; rhizome has its own operator surfaces.

2. **Migrate** `/api/usage` to consume `hyphae-session-timeline-v1` or a new hyphae aggregate endpoint instead of scanning JSONL transcripts directly. This removes the most fragile direct file coupling.

3. **Migrate** `/api/telemetry` once cortina emits structured session lifecycle events. Until then, leave as-is with a comment marking it as rebuild target.

4. **Contract-migrate** hyphae CLI routes (`/api/hyphae` reads, `/api/sessions`) by switching to the existing septa-validated CLI payloads (`hyphae-session-timeline-v1`, `hyphae-analytics-v1`, etc.) more consistently, then move toward direct MCP calls as hyphae stabilises its MCP surface.

5. **Contract-migrate** mycelium, annulus, and settings CLI routes as those sibling endpoints are defined (tracked in C7/C8 handoffs).

---

## Freeze Rules

Until this report is accepted and the cuts in the Rebuild Plan are applied:

1. **No new front-end routes** may be added to Cap.
2. **No new server API namespaces** may be added unless they replace an existing CLI coupling with a typed contract.
3. **No new direct database reads** into sibling tool databases (canopy.db is grandfathered; hyphae.db and rhizome database are not).
4. **No new direct file scans** for data that a sibling tool CLI or MCP surface already exposes.
5. Code intelligence work (symbol browsing, LSP management) is **out of scope** for Cap; route it to rhizome handoffs instead.
