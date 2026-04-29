# Cap API Reference

Cap's API is read-heavy but not read-only. Some routes only read from sibling
tools or the Hyphae database, while others write through to Hyphae, Rhizome,
settings files, Canopy actions, or LSP installation.

## Auth

All `/api/*` routes are protected. Two public endpoints are always accessible regardless of auth configuration:

- `GET /api/health` — returns `{ status: "ok" }`
- `GET /api/client-config` — returns `{ authRequired: boolean }`

### Auth modes

| Condition | Behavior |
|-----------|----------|
| `CAP_API_KEY` set | Requires `Authorization: Bearer <key>` on all routes. Missing or wrong key returns `401` or `403`. |
| `CAP_API_KEY` unset + localhost bind (default) | All routes are open (local-dev pass-through). |
| `CAP_API_KEY` unset + non-loopback bind | All routes return `503` with a message instructing the operator to set `CAP_API_KEY`. |
| `CAP_ALLOW_UNAUTHENTICATED=1` | Bypass override — all routes are open regardless of bind address. Logs a warning. |

### CORS

The `CORS_ORIGIN` variable controls the allowed frontend origin (default: `http://localhost:5173`).

### Webhook auth

`POST /api/watchers/webhook` and `POST /api/watchers/github` validate HMAC signatures. Unsigned payloads are rejected by default. The escape hatch is `CAP_ALLOW_UNAUTHENTICATED=1`.

| Env var | Route | Header |
|---------|-------|--------|
| `CAP_WEBHOOK_SECRET` | `/api/watchers/webhook` | `X-Webhook-Signature: sha256=<hex>` |
| `CAP_GITHUB_SECRET` | `/api/watchers/github` | `X-Hub-Signature-256: sha256=<hex>` |

---

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
| `cost` | `GET`, `POST`, `PUT` | Cost entry recording, spend summaries, and budget management |
| `ecosystem` | `GET` | Annulus ecosystem status |
| `hyphae` | `GET`, `POST`, `PUT`, `DELETE` | Memory and memoir reads plus mutation endpoints |
| `lsp` | `GET`, `POST` | Language-server status and install actions |
| `mycelium` | `GET` | Gain, history, and analytics reads |
| `rhizome` | `GET`, `POST` | Symbol/code intelligence reads, edits, and project switching |
| `sessions` | `GET`, `POST` | Session timeline events and conversation ID persistence |
| `settings` | `GET`, `POST`, `PUT` | Settings reads, mode activation, and config writes |
| `status` | `GET` | Overall ecosystem status |
| `telemetry` | `GET` | Telemetry rollup |
| `usage` | `GET` | Session usage rollups and trends |
| `watchers` | `GET`, `POST` | Webhook and GitHub event ingestion |

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

Status preview and customization reads should consume the portable
`resolved-status-customization-v1` shape rather than acting as the source of
truth for host-specific statusline config blobs.

## Telemetry

- `GET /telemetry/`

Returns the telemetry rollup or a 500 error if telemetry aggregation fails.

## Usage

- `GET /usage/`
- `GET /usage/sessions`
- `GET /usage/trend`

These routes are consumer surfaces. They should read normalized usage summaries and session history from ecosystem tools instead of acting as the source contract for host usage parsing.

## Cost

Cost entry recording and budget enforcement.

- `POST /cost/` — record a cost entry (`session_id`, `model`, `prompt_tokens`, `completion_tokens`, `cost_usd`). Returns `{ entry_id, status }`. Returns `402` when the budget is exceeded.
- `GET /cost/summary` — aggregate spend by day, week, and month.
- `GET /cost/budget/status` — current budget status (remaining, spent, limit).
- `PUT /cost/budget` — update budget config (`daily_limit_usd`, `weekly_limit_usd`, `monthly_limit_usd`, `per_session_limit_usd`, `warn_at_percent`).

## Ecosystem

- `GET /ecosystem/status` — returns the Annulus ecosystem status document (delegates to `annulus status --json`).

## Sessions

Session timeline and conversation ID persistence.

- `GET /sessions/:id/timeline` — returns timeline events for a session by ID. Returns `404` if the session is not found.
- `GET /sessions/:id/conversation` — returns the stored `conversation_id` for a session.
- `POST /sessions/:id/conversation` — stores a `conversation_id` for a session. Body: `{ conversation_id: string }`.

## Watchers

Generic webhook and GitHub event ingestion.

- `GET /watchers/` — list available watcher adapters.
- `POST /watchers/webhook` — receive a generic webhook payload. Requires `X-Webhook-Signature: sha256=<hex>` (validated against `CAP_WEBHOOK_SECRET`).
- `POST /watchers/github` — receive a GitHub webhook payload. Requires `X-Hub-Signature-256: sha256=<hex>` (validated against `CAP_GITHUB_SECRET`).

## Notes

- Treat each route group as its own contract surface.
- Write routes often have extra validation, especially where they forward into
  sibling CLIs or config files.
- When a route mirrors another tool's schema, update the matching contract docs
  and tests together.
