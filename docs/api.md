# Cap API Reference

Cap's API is read-heavy but not read-only. Some routes only read from sibling
tools or the Hyphae database, while others write through to Hyphae, Rhizome,
settings files, Canopy actions, or LSP installation.

## Base URL

Development: `http://localhost:3001/api`

## Response Shape

Most endpoints return JSON objects or arrays directly. A few write routes return
ad hoc `error` payloads on failure rather than a single shared envelope, so treat
each route group as its own contract.

## Route Groups

| Namespace | Methods | Purpose |
|-----------|---------|---------|
| `canopy` | `GET`, `POST` | Task snapshots, task actions, and handoff actions |
| `hyphae` | `GET`, `POST`, `PUT`, `DELETE` | Memory and memoir reads plus mutation endpoints |
| `lsp` | `GET`, `POST` | Language-server status and install actions |
| `mycelium` | `GET` | Gain, history, and analytics reads |
| `rhizome` | `GET`, `POST` | Symbol/code intelligence reads, edits, and project switching |
| `settings` | `GET`, `POST`, `PUT` | Settings reads, mode activation, and config writes |
| `status` | `GET` | Overall ecosystem status |
| `telemetry` | `GET` | Telemetry rollup |
| `usage` | `GET` | Session usage rollups and trends |

## Hyphae

Memory and memoir management.

### Reads

- `GET /hyphae/stats`
- `GET /hyphae/topics`
- `GET /hyphae/topics/:topic/memories`
- `GET /hyphae/recall`
- `GET /hyphae/search-global`
- `GET /hyphae/memories/:id`
- `GET /hyphae/health`
- `GET /hyphae/memoirs`
- `GET /hyphae/memoirs/search-all`
- `GET /hyphae/memoirs/:name`
- `GET /hyphae/memoirs/:name/inspect/:concept`
- `GET /hyphae/memoirs/:name/search`
- `GET /hyphae/sessions`
- `GET /hyphae/sessions/timeline`
- `GET /hyphae/lessons`
- `GET /hyphae/analytics`
- `GET /hyphae/sources`
- `GET /hyphae/context`

### Writes

- `POST /hyphae/store`
- `DELETE /hyphae/memories/:id`
- `PUT /hyphae/memories/:id/importance`
- `POST /hyphae/memories/:id/invalidate`
- `POST /hyphae/consolidate`

## Canopy

Task coordination and handoff actions.

- `GET /canopy/snapshot`
- `GET /canopy/tasks/:taskId`
- `POST /canopy/tasks/:taskId/actions`
- `POST /canopy/handoffs/:handoffId/actions`

The task-action endpoint accepts operator actions such as claim, start, pause,
resume, complete, verify, record decision, and evidence attachment.

## LSP

Language-server status and install control.

- `GET /lsp/status`
- `POST /lsp/install`

## Mycelium

Token savings and command-history rollups.

- `GET /mycelium/gain`
- `GET /mycelium/gain/history`
- `GET /mycelium/analytics`
- `GET /mycelium/history`

## Rhizome

Code-intelligence reads, edits, and project switching.

### Reads

- `GET /rhizome/analytics`
- `GET /rhizome/status`
- `GET /rhizome/symbols`
- `GET /rhizome/definition`
- `GET /rhizome/structure`
- `GET /rhizome/annotations`
- `GET /rhizome/complexity`
- `GET /rhizome/dependencies`
- `GET /rhizome/tests`
- `GET /rhizome/exports`
- `GET /rhizome/summary`
- `GET /rhizome/type-definitions`
- `GET /rhizome/parameters`
- `GET /rhizome/references`
- `GET /rhizome/hover`
- `GET /rhizome/scope`
- `GET /rhizome/enclosing-class`
- `GET /rhizome/search`
- `GET /rhizome/diagnostics`
- `GET /rhizome/files`
- `GET /rhizome/call-sites`
- `GET /rhizome/symbol-body`
- `GET /rhizome/project`

### Writes

- `POST /rhizome/rename`
- `POST /rhizome/copy-symbol`
- `POST /rhizome/move-symbol`
- `POST /rhizome/project`

`POST /rhizome/project` switches the active project root and is now boundary
checked against approved roots.

## Settings

Configuration reads and writes for ecosystem tools.

- `GET /settings/`
- `GET /settings/modes`
- `POST /settings/modes/activate`
- `POST /settings/stipe/run`
- `GET /settings/stipe/repair-plan`
- `POST /settings/hyphae/prune`
- `PUT /settings/mycelium`
- `PUT /settings/rhizome`
- `PUT /settings/hyphae`

## Status

- `GET /status/`

Returns the aggregated ecosystem status document.

## Telemetry

- `GET /telemetry/`

Returns the telemetry rollup or a 500 error if telemetry aggregation fails.

## Usage

- `GET /usage/`
- `GET /usage/sessions`
- `GET /usage/trend`

These routes are consumer surfaces. They should read normalized usage summaries and session history from ecosystem tools instead of acting as the source contract for host usage parsing.

## Notes

- Treat each route group as its own contract surface.
- Write routes often have extra validation, especially where they forward into
  sibling CLIs or config files.
- When a route mirrors another tool's schema, update the matching contract docs
  and tests together.
