# Cap Getting Started

Cap is a web dashboard for the claude-mycelium ecosystem. It shows Hyphae memories, Mycelium token savings, and Rhizome code intelligence in a unified interface.

## Prerequisites

- Node.js 24 or later
- Hyphae installed (`hyphae --version` should work)
- Optionally: Rhizome installed for code intelligence

Verify prerequisites:

```bash
node --version              # Should be 20+
hyphae --version            # Should be installed
mycelium --version          # Should be installed
rhizome --version           # Optional; if not installed, features degrade gracefully
```

## Setup

Clone the repository and install dependencies:

```bash
cd cap
npm install
npm run dev:all             # Starts frontend (localhost:5173) and backend (localhost:3001)
```

Open http://localhost:5173 in your browser.

The dashboard loads automatically and connects to your local Hyphae database. If Hyphae hasn't been initialized yet, run:

```bash
hyphae init
```

## What You'll See

Dashboard shows ecosystem health badges (Hyphae ✓/✗, Mycelium ✓/✗, Rhizome ✓/✗), total memory count, topic breakdown, average memory weight, and token savings percentage. A "Quick Context" search bar lets you describe a task and get relevant memories injected with token budgeting. The memory health chart shows per-topic weight decay and importance distribution (critical/high/fading).

Memories is a browse-first interface. Start with topic cards showing memory count and average weight per topic. Click a topic to see all memories in a table with summary, importance level, weight, keywords, and age. Search memories by FTS (full-text search) or click the "Memories" link from any topic. Click a memory row to open a detail modal showing raw excerpt, topic, weight progress, access count, keywords, created/updated/accessed dates, and related memory IDs.

Memoirs is a concept graph explorer. It lists all knowledge graphs and allows searching across all concepts. Click a memoir to explore its concept graph with interactive visualization. Use the depth slider to control BFS traversal depth (1–5 hops). Node colors represent concept kinds (function, class, interface, module, other). Edge colors show relation types (calls, contains, implements, imports). Click a concept node to inspect it with its full neighborhood.

Analytics is a multi-tab dashboard covering token savings trends, memory health metrics, code intelligence coverage, telemetry events, and usage/cost analysis. The Token Savings tab shows total tokens saved and per-command breakdown. Memory Health displays topic health, weight distribution, and consolidation recommendations. Code Intelligence lists indexed languages and symbol counts. Telemetry shows event frequency. Usage/Cost breaks down sessions and API call costs.

Code Explorer is a file tree browser with symbol outline. Navigate the project file tree on the left; click a file to show its symbols (functions, classes, types, constants) on the right. Click a symbol to jump to it with syntax highlighting. The Tests and Annotations tabs show test definitions and code comments/annotations. Use "Find References" to see all usages of a selected symbol across the project.

Symbol Search is a global cross-project symbol search. Type a symbol name (function, class, type, constant) and see matches across the entire codebase. Results show file path, line number, and symbol kind. Click a result to open the Code Explorer at that symbol's location.

Diagnostics shows all TypeScript/Rust/JavaScript/Python errors and warnings from the language server, organized by file and severity (error/warning). Click a diagnostic to jump to its location in the Code Explorer. This page requires the relevant language server to be installed and running (see Settings for LSP management).

Status shows an ecosystem architecture diagram of how Mycelium, Hyphae, and Rhizome connect, along with installed tool versions, LSP server status, database size, and overall health.

Settings handles configuration and system management. Each tool card shows the resolved file path Cap is using plus a provenance badge:
- `Config file`: Cap found a real config file and is reading it
- `Env override`: an environment variable selected this path
- `Platform default`: Cap is using the current OS default path because no override file was found

Mycelium shows config path and integration toggles. Hyphae shows config path, database path, size, and pruning options (set a weight threshold to delete old, fading memories). Rhizome shows config path, auto-export state, and language coverage. LSP Manager lets you install/uninstall language servers and view their status and version.

## Troubleshooting

**Dashboard shows no data**: Check that Hyphae has initialized and has a valid database. Run `hyphae stats` to verify the database exists. If empty, store a test memory:
```bash
hyphae store -t "test" -c "Test memory" -i high
```
Then refresh the Cap dashboard.

**Rhizome unavailable**: Rhizome binary must be in your PATH. Verify:
```bash
command -v rhizome   # PowerShell: Get-Command rhizome
rhizome --version
```
If not installed, install from the Rhizome project. Once installed, restart the Cap backend.

**Charts show warnings**: Some charts may not render in hidden/minimized tabs. Expand the tab and refresh the page. This is a limitation of Recharts with hidden DOM elements.

**Code Explorer shows no files**: Ensure Cap's backend is pointing to the right project. Check the `RHIZOME_PROJECT` environment variable (defaults to `process.cwd()` at startup). If working in a monorepo, set:
```bash
RHIZOME_PROJECT=/path/to/subproject npm run dev:server
```

**LSP server not detecting errors**: Verify the language server is installed (Settings > LSP Manager). For TypeScript, `typescript` must be in `node_modules`. For Rust, `rust-analyzer` must be in PATH. Restart the backend after installing a new server.

## Development

Start in dev mode to get hot reloads:

```bash
npm run dev:all    # Frontend and backend with file watching
```

Frontend changes auto-reload in the browser. Backend changes require a manual restart.

Build for production:

```bash
npm run build      # TypeScript + Vite build
npm run preview    # Preview production bundle
```

Run tests:

```bash
npm test           # Vitest
npm run test:watch # Watch mode
```

Format code:

```bash
npm run lint       # Biome check and auto-fix
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `HYPHAE_DB` | `~/.local/share/hyphae/hyphae.db` | Path to Hyphae database |
| `HYPHAE_BIN` | `hyphae` | Hyphae CLI binary (must be in PATH) |
| `MYCELIUM_BIN` | `mycelium` | Mycelium CLI binary (must be in PATH) |
| `RHIZOME_BIN` | `rhizome` | Rhizome CLI binary (must be in PATH) |
| `RHIZOME_PROJECT` | `process.cwd()` | Project root for Rhizome analysis |
| `NODE_ENV` | — | Set to `production` for prod-style logging |
| `LOG_LEVEL` | `debug` or `info` | Pino log level |

Example:

```bash
HYPHAE_DB=~/my-hyphae.db RHIZOME_PROJECT=/path/to/project npm run dev:all
```

## Next Steps

Enable Hyphae MCP in Claude Code or your editor with `hyphae init`. Use Mycelium in your terminal to reduce AI-related token usage. Install language servers (TypeScript, Rust, Python, Go) in LSP Manager for full diagnostics.
