# Cap

Web dashboard for the Basidiocarp ecosystem. Gives operators one interface for
memory, token analytics, code intelligence, and runtime health instead of
jumping between terminals and SQLite files.

Named after the fungal cap, the visible top layer that makes the rest of the
organism legible from the outside.

Part of the [Basidiocarp ecosystem](https://github.com/basidiocarp).

---

## The Problem

The ecosystem already captures useful data, but most of it lives behind CLIs,
databases, and MCP calls. That makes operator workflows slow: you can inspect
one tool at a time, but not the combined state of memory, savings, code health,
and host readiness.

## The Solution

Cap is the operator-facing surface for the stack. The React app handles memory,
analytics, and code exploration; the Hono server reads from Hyphae, Mycelium,
Rhizome, and Stipe while also brokering explicit write-through actions for
settings, Rhizome project selection, and Canopy task workflows without becoming
another source of truth.

---

## The Ecosystem

| Tool | Purpose |
|------|---------|
| **[cap](https://github.com/basidiocarp/cap)** | Web dashboard for the ecosystem |
| **[canopy](https://github.com/basidiocarp/canopy)** | Multi-agent coordination runtime |
| **[cortina](https://github.com/basidiocarp/cortina)** | Lifecycle signal capture and session attribution |
| **[hyphae](https://github.com/basidiocarp/hyphae)** | Persistent agent memory |
| **[lamella](https://github.com/basidiocarp/lamella)** | Skills, hooks, and plugins for coding agents |
| **[mycelium](https://github.com/basidiocarp/mycelium)** | Token-optimized command output |
| **[rhizome](https://github.com/basidiocarp/rhizome)** | Code intelligence via tree-sitter and LSP |
| **[spore](https://github.com/basidiocarp/spore)** | Shared transport and editor primitives |
| **[stipe](https://github.com/basidiocarp/stipe)** | Ecosystem installer and manager |
| **[volva](https://github.com/basidiocarp/volva)** | Execution-host runtime layer |

> **Boundary:** `cap` owns the operator interface. It does not own memory
> storage, token filtering, code parsing, lifecycle capture, or install policy,
> but it does broker some explicit writes on behalf of the operator.

---

## Quick Start

```bash
npm install
npm run dev:all
```

```bash
npm run dev           # frontend only
npm run dev:server    # backend only
npm run build         # production build
npm test              # Vitest
```

---

## How It Works

```text
Browser                  Cap server                 Ecosystem tools
───────                  ──────────                 ───────────────
route load       ───►    Hono route         ───►    hyphae CLI / DB
filter or query   ───►   typed read layer   ───►    mycelium, rhizome, stipe
render charts     ◄───   JSON response      ◄───    route results
```

1. Serve pages: React renders dashboard, memory, symbol, and onboarding views.
2. Collect data: the server reads from Hyphae, Mycelium, Rhizome, Stipe, and the operational route groups.
3. Normalize results: route handlers convert CLI and database output into UI-friendly shapes and forward explicit write-through actions.
4. Render operations state: charts, tables, and status views expose the combined ecosystem picture.

---

## Core Pages

| Route | Page | What it does |
|------|------|--------------|
| `/` | Dashboard | Memory stats, topic breakdown, and health overview |
| `/memories` | Memories | Search and filter memory records |
| `/memoirs` | Memoirs | Explore knowledge graphs and concept links |
| `/code` | Code Explorer | Inspect file trees and symbol outlines |
| `/symbols` | Symbol Search | Search project-wide symbols |
| `/diagnostics` | Diagnostics | Show LSP diagnostics |
| `/onboard` | Onboarding | Surface setup guidance and repair steps |
| `/analytics` | Analytics | Show token savings and memory trends |
| `/status` | Status | Show ecosystem health across tools |

---

## What Cap Owns

- Operator-facing UI and navigation
- Boundary-aware aggregation across ecosystem tools
- Route handlers that normalize tool output for the browser
- Explicit write-through surfaces for settings, Rhizome project selection, and operator actions
- Visualization of memory, analytics, code, and health data

## What Cap Does Not Own

- Persistent memory storage: handled by `hyphae`
- Token filtering and savings capture: handled by `mycelium`
- Code intelligence backends: handled by `rhizome`
- Host and install health remediation: handled by `stipe`

---

## Key Features

- Unified dashboard: brings together memory, code intelligence, and tool status in one UI.
- Boundary-aware backend: uses CLI and database reads where possible, then writes through only where the operator workflow requires it.
- Operator onboarding: includes setup-focused routes for new installs and repair flows.
- Analytics views: surfaces token savings and memory health without requiring manual shell work.

---

## Architecture

```text
cap
├── src/pages/        route-level React pages
├── src/components/   shared UI building blocks
├── src/store/        client state
├── src/theme/        Mantine theme and visual tokens
├── server/routes/    Hono HTTP routes
├── server/hyphae/    Hyphae read adapters
├── server/mycelium/  Mycelium read adapters
├── server/rhizome/   Rhizome read adapters
└── docs/             UI and API notes
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `HYPHAE_DB` | `~/.local/share/hyphae/hyphae.db` | Hyphae database path |
| `HYPHAE_BIN` | `hyphae` | Hyphae CLI binary |
| `MYCELIUM_BIN` | `mycelium` | Mycelium CLI binary |
| `RHIZOME_BIN` | `rhizome` | Rhizome CLI binary |
| `RHIZOME_PROJECT` | `process.cwd()` | Project root for Rhizome analysis |

---

## Documentation

- [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md): local setup and first run
- [docs/API.md](docs/API.md): backend routes and server contract notes
- [docs/INTERNALS.md](docs/INTERNALS.md): implementation structure and technical details
- [docs/ROADMAP.md](docs/ROADMAP.md): planned dashboard work
- [docs/design-choices.md](docs/design-choices.md): UX and implementation tradeoffs

## Development

```bash
npm run dev:all
npm run build
npm test
npm run lint
```

## License

See repository license.
