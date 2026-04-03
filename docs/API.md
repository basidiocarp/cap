# Cap API Reference

Cap's backend exposes REST endpoints for memory management, token analytics, code intelligence, and ecosystem health. Every endpoint returns JSON.

## Base URL

Development: `http://localhost:3001/api`

## Response Format

All responses follow a consistent JSON envelope:

```json
{
  "data": { ... },
  "error": null
}
```

On error, the `error` field contains a message and `data` is null. HTTP status codes indicate success (2xx) or failure (4xx/5xx).

## Hyphae

Memory and memoir management.

### GET /hyphae/stats

Returns memory count and averages.

**Response**:
```json
{
  "total_memories": 45,
  "total_topics": 8,
  "avg_weight": 0.567,
  "oldest": "2025-03-01T10:00:00Z",
  "newest": "2025-03-20T15:30:00Z"
}
```

### GET /hyphae/topics

List all topics with memory counts and average weight.

**Response**:
```json
[
  {
    "topic": "decisions-api",
    "count": 12,
    "avg_weight": 0.72,
    "newest": "2025-03-20T15:30:00Z"
  },
  ...
]
```

### GET /hyphae/topics/:topic/memories

Get all memories in a topic.

**Query Parameters**:
- `limit` (optional, default 20, max 200): Max results to return

**Response**:
```json
[
  {
    "id": "mem_abc123",
    "topic": "decisions-api",
    "summary": "Chose REST over GraphQL",
    "importance": "high",
    "weight": 0.85,
    "keywords": ["architecture", "api-design"],
    "created_at": "2025-03-15T10:00:00Z",
    "updated_at": "2025-03-15T10:00:00Z",
    "last_accessed": "2025-03-20T10:00:00Z",
    "access_count": 3,
    "source_type": "memory",
    "raw_excerpt": "REST chosen for v1 simplicity and faster time-to-market"
  },
  ...
]
```

### GET /hyphae/recall

Search memories by full-text query.

**Query Parameters**:
- `q` (required): Search query
- `topic` (optional): Filter by topic
- `limit` (optional, default 20, max 200): Max results

**Response**: Same format as `/topics/:topic/memories`

### GET /hyphae/memories/:id

Get a single memory by ID.

**Response**: Single memory object (see `/topics/:topic/memories` format)

**Status Codes**:
- `200 OK`: Memory found
- `404 Not Found`: Memory ID doesn't exist

### GET /hyphae/health

Memory health overview per topic.

**Query Parameters**:
- `topic` (optional): Get health for a single topic; if omitted, returns all topics

**Response**:
```json
[
  {
    "topic": "decisions-api",
    "critical_count": 1,
    "high_count": 5,
    "low_weight_count": 2,
    "avg_weight": 0.72,
    "last_activity": "2025-03-20T15:30:00Z"
  },
  ...
]
```

### GET /hyphae/memoirs

List all memoirs with concept counts.

**Response**:
```json
[
  {
    "name": "backend-architecture",
    "description": "Backend architecture decisions",
    "concept_count": 15,
    "created_at": "2025-03-01T10:00:00Z"
  },
  ...
]
```

### GET /hyphae/memoirs/:name

Show a single memoir with all concepts and links.

**Response**:
```json
{
  "name": "backend-architecture",
  "description": "Backend architecture decisions",
  "concepts": [
    {
      "id": "con_abc123",
      "name": "auth-service",
      "definition": "Handles user authentication and JWT validation",
      "kind": "service",
      "labels": ["domain:auth", "type:service"],
      "revision": 2,
      "confidence": 0.95
    },
    ...
  ],
  "links": [
    {
      "from": "auth-service",
      "to": "postgres",
      "relation": "depends-on",
      "weight": 0.9
    },
    ...
  ]
}
```

### GET /hyphae/memoirs/search-all

Search across all memoirs.

**Query Parameters**:
- `q` (required): Search query

**Response**: List of concept objects matching the query

### GET /hyphae/memoirs/:name/search

Search within a single memoir.

**Query Parameters**:
- `q` (required): Search query
- `label` (optional): Filter by label

**Response**: List of concept objects in the memoir matching the query

### GET /hyphae/memoirs/:name/inspect/:concept

Inspect a concept and its neighborhood with BFS traversal.

**Query Parameters**:
- `depth` (optional, default 2, max 5): Traversal depth

**Response**:
```json
{
  "concept": {
    "name": "auth-service",
    "definition": "...",
    "kind": "service",
    "labels": ["domain:auth"]
  },
  "neighborhood": [
    {
      "concept": "postgres",
      "relation": "depends-on",
      "distance": 1
    },
    {
      "concept": "cache",
      "relation": "depends-on",
      "distance": 2
    }
  ]
}
```

### GET /hyphae/analytics

Memory and embedding analytics.

**Response**:
```json
{
  "total_memories": 45,
  "total_memoirs": 3,
  "total_concepts": 78,
  "embeddings_enabled": true,
  "embedding_model": "BAAI/bge-small-en-v1.5",
  "embeddings_count": 38,
  "memory_utilization": {
    "rate": 0.84,
    "threshold": 0.9
  }
}
```

### GET /hyphae/context

Gather relevant context for a task (multi-source aggregation).

**Query Parameters**:
- `task` (required): Task description to gather context for
- `project` (optional): Filter to a specific project
- `budget` (optional, default 5000): Token budget for context (clamped 2000-50000)
- `include` (optional): Comma-separated sources to include (e.g., `memories,errors,sessions`)

**Response**:
```json
{
  "context": [
    {
      "source": "memory",
      "topic": "decisions-api",
      "symbol": null,
      "content": "REST chosen for v1 simplicity",
      "relevance": 0.92
    },
    ...
  ],
  "tokens_used": 1234,
  "tokens_budget": 5000,
  "sources_queried": ["memories", "errors", "sessions"]
}
```

### POST /hyphae/store

Store a memory.

**Request Body**:
```json
{
  "topic": "decisions-api",
  "summary": "Chose REST over GraphQL",
  "importance": "high",
  "keywords": ["architecture", "api-design"]
}
```

**Importance Values**: `critical`, `high`, `medium`, `low`, `ephemeral`

**Response**:
```json
{
  "result": "Stored memory: mem_abc123"
}
```

### DELETE /hyphae/memories/:id

Delete a memory by ID.

**Response**:
```json
{
  "result": "Deleted memory: mem_abc123"
}
```

### POST /hyphae/consolidate

Replace all memories of a topic with a single summary.

**Request Body**:
```json
{
  "topic": "decisions-api",
  "keep_originals": false
}
```

**Response**:
```json
{
  "result": "Consolidated topic: 12 entries → 1 summary"
}
```

## Mycelium

Token savings and command statistics.

### GET /mycelium/gain

Get token savings statistics.

**Query Parameters**:
- `format` (optional, default `json`): `json` or `text`

**Response**:
```json
{
  "avg_savings_pct": 72.3,
  "total_tokens_saved": 45678,
  "total_tokens_input": 156234,
  "commands_run": 234,
  "top_filters": [
    {
      "filter": "cargo test",
      "count": 45,
      "avg_savings_pct": 89.2
    },
    ...
  ]
}
```

### GET /mycelium/gain/history

Historical token savings data.

**Query Parameters**:
- `format` (optional, default `json`): `json` or `text`

**Response**:
```json
[
  {
    "timestamp": "2025-03-20T10:00:00Z",
    "filter": "cargo test",
    "tokens_input": 1234,
    "tokens_output": 123,
    "savings_pct": 90.0
  },
  ...
]
```

## Rhizome

Code intelligence via tree-sitter and LSP.

### GET /rhizome/status

Check if Rhizome is available.

**Response**:
```json
{
  "available": true,
  "backend": "lsp",
  "version": "0.5.0"
}
```

### GET /rhizome/files

Browse project file tree.

**Query Parameters**:
- `path` (optional): Directory path to list (relative to project root)
- `depth` (optional, default 2, max 5): Traversal depth

**Response**:
```json
[
  {
    "path": "src",
    "kind": "directory",
    "children": [
      { "path": "main.rs", "kind": "file", "size": 1234 }
    ]
  },
  ...
]
```

### GET /rhizome/symbols

Get all symbols in a file.

**Query Parameters**:
- `file` (required): File path (relative to project root)

**Response**:
```json
[
  {
    "name": "parse_config",
    "kind": "function",
    "line": 42,
    "column": 0,
    "type_": "fn(path: &str) -> Result<Config>"
  },
  ...
]
```

### GET /rhizome/structure

Get file structure with nesting.

**Query Parameters**:
- `file` (required): File path
- `depth` (optional, default 3, max 5): Nesting depth

**Response**:
```json
{
  "name": "main.rs",
  "kind": "file",
  "children": [
    {
      "name": "main",
      "kind": "function",
      "line": 10,
      "children": [...]
    }
  ]
}
```

### GET /rhizome/definition

Get symbol definition with source code.

**Query Parameters**:
- `file` (required): File path
- `symbol` (required): Symbol name

**Response**:
```json
{
  "name": "parse_config",
  "kind": "function",
  "file": "src/main.rs",
  "line": 42,
  "column": 0,
  "source": "fn parse_config(path: &str) -> Result<Config> {\n  ...\n}",
  "documentation": "Parse configuration from a TOML file"
}
```

### GET /rhizome/search

Global symbol search across the project.

**Query Parameters**:
- `pattern` (required): Symbol name or regex pattern
- `path` (optional): Search only within a directory

**Response**:
```json
[
  {
    "symbol": "parse_config",
    "kind": "function",
    "file": "src/main.rs",
    "line": 42
  },
  ...
]
```

### GET /rhizome/references

Find all usages of a symbol.

**Query Parameters**:
- `file` (required): File containing the symbol
- `line` (required): Line number (0-indexed)
- `column` (required): Column number (0-indexed)

**Response**:
```json
[
  {
    "file": "src/main.rs",
    "line": 50,
    "column": 10,
    "context": "let config = parse_config(\"config.toml\")?;"
  },
  ...
]
```

### GET /rhizome/diagnostics

Get LSP diagnostics (errors/warnings) for a file.

**Query Parameters**:
- `file` (required): File path

**Response**:
```json
[
  {
    "file": "src/main.rs",
    "line": 42,
    "column": 5,
    "severity": "error",
    "message": "expected `;` but found `}`",
    "code": "E0001"
  },
  ...
]
```

### GET /rhizome/hover

Get hover information for a symbol at a location.

**Query Parameters**:
- `file` (required): File path
- `line` (required): Line number (0-indexed)
- `column` (required): Column number (0-indexed)

**Response**:
```json
{
  "content": "fn parse_config(path: &str) -> Result<Config>",
  "range": { "start": { "line": 42, "column": 0 }, "end": { "line": 42, "column": 12 } }
}
```

### GET /rhizome/project

Get current project information.

**Response**:
```json
{
  "path": "/path/to/project",
  "languages": ["rust", "typescript"],
  "file_count": 234,
  "total_symbols": 1456
}
```

### POST /rhizome/project

Switch the active project for analysis.

**Request Body**:
```json
{
  "path": "/path/to/new/project"
}
```

**Response**:
```json
{
  "path": "/path/to/new/project",
  "languages": ["rust"],
  "file_count": 145
}
```

## Status

Ecosystem health and integration status.

### GET /status

Aggregated health check for all three tools.

**Response**:
```json
{
  "mycelium": {
    "available": true,
    "version": "0.5.2",
    "avg_savings_pct": 72.3
  },
  "hyphae": {
    "available": true,
    "version": "0.4.1",
    "total_memories": 45,
    "db_size_bytes": 1234567
  },
  "rhizome": {
    "available": true,
    "version": "0.5.0",
    "languages": ["rust", "typescript", "python"]
  }
}
```

## Settings

Configuration and system management.

### GET /settings

Get current ecosystem settings.

**Response**:
```json
{
  "mycelium": {
    "config_path": "<platform config dir>/mycelium/config.toml",
    "config_present": true,
    "config_source": "config_file",
    "filters": {
      "hyphae": { "enabled": true },
      "rhizome": { "enabled": true }
    },
    "resolved_config_path": "<platform config dir>/mycelium/config.toml"
  },
  "hyphae": {
    "config_path": "<platform config dir>/hyphae/config.toml",
    "config_present": true,
    "config_source": "config_file",
    "db_path": "<platform data dir>/hyphae/hyphae.db",
    "db_source": "platform_default",
    "db_size_bytes": 2345678,
    "resolved_config_path": "<platform config dir>/hyphae/config.toml"
  },
  "rhizome": {
    "config_path": "<platform config dir>/rhizome/config.toml",
    "config_present": false,
    "config_source": "platform_default",
    "auto_export": false,
    "languages_enabled": 32,
    "resolved_config_path": "<platform config dir>/rhizome/config.toml"
  }
}
```

`config_path` is only populated when a file exists on disk. `resolved_config_path` is the path Cap will try to read or write on the current machine. The `*_source` fields explain why that path is active:
- `config_file`: a real config file was found and is in use
- `env_override`: an environment variable override selected the path
- `platform_default`: no override was found, so Cap is using the default path for the current OS

### POST /settings/mycelium

Update Mycelium settings.

**Request Body**:
```json
{
  "hyphae_enabled": true,
  "rhizome_enabled": false
}
```

### POST /settings/hyphae

Update Hyphae settings.

**Request Body**:
```json
{
  "embedding_model": "BAAI/bge-base-en-v1.5"
}
```

### POST /settings/hyphae/prune

Prune old memories below a weight threshold.

**Request Body**:
```json
{
  "threshold": 0.2
}
```

**Response**:
```json
{
  "pruned_count": 8,
  "removed_memories": 8
}
```

### POST /settings/rhizome

Update Rhizome settings.

**Request Body**:
```json
{
  "enabled_languages": ["rust", "typescript"]
}
```

## LSP

Language server management.

### GET /lsp/servers

List all available language servers.

**Response**:
```json
[
  {
    "language": "rust",
    "installed": true,
    "version": "0.3.2017",
    "enabled": true
  },
  {
    "language": "typescript",
    "installed": false,
    "version": null,
    "enabled": false
  }
]
```

### POST /lsp/servers/:language/install

Install a language server.

**Response**:
```json
{
  "language": "rust",
  "message": "rust-analyzer installed successfully"
}
```

### POST /lsp/servers/:language/uninstall

Uninstall a language server.

**Response**:
```json
{
  "language": "rust",
  "message": "rust-analyzer uninstalled"
}
```

## Usage

Command and session analytics.

### GET /usage/aggregate

Aggregated usage statistics.

**Response**:
```json
{
  "total_sessions": 42,
  "total_commands": 1234,
  "avg_commands_per_session": 29.4,
  "total_duration_seconds": 45678
}
```

### GET /usage/sessions

Recent sessions with command counts and duration.

**Query Parameters**:
- `limit` (optional, default 20): Max sessions to return

**Response**:
```json
[
  {
    "session_id": "sess_abc123",
    "started_at": "2025-03-20T10:00:00Z",
    "ended_at": "2025-03-20T11:30:00Z",
    "duration_seconds": 5400,
    "command_count": 34
  },
  ...
]
```

### GET /usage/trend

Usage trend over time.

**Query Parameters**:
- `days` (optional, default 30): Days of history to include

**Response**:
```json
[
  {
    "date": "2025-03-20",
    "sessions": 5,
    "commands": 156,
    "avg_commands_per_session": 31.2
  },
  ...
]
```

## Telemetry

Anonymous telemetry and event tracking.

### GET /telemetry

Get telemetry summary.

**Response**:
```json
{
  "events_total": 1234,
  "top_events": [
    { "event": "memory_store", "count": 456 },
    { "event": "memory_recall", "count": 234 }
  ]
}
```

## Error Handling

All endpoints return standard HTTP status codes:

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Invalid request (missing required params, invalid values) |
| `404` | Resource not found |
| `500` | Server error |

Error responses include a message:

```json
{
  "error": "Memory not found"
}
```

## Rate Limiting

No rate limiting is currently enforced. Production deployments should add rate limiting middleware.

## CORS

CORS is enabled for development. Set `CORS_ORIGIN` in the backend to match your frontend origin.
