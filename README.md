# Cap

Web dashboard for the [claude-mycelium](https://github.com/williamnewton/claude-mycelium) ecosystem. Browse Hyphae memories, explore knowledge graphs, view Mycelium token savings, and inspect code intelligence via Rhizome — all from one interface.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Memory stats, topic breakdown, health overview |
| `/memories` | Memories | Full-text search and filter memories |
| `/memoirs` | Memoirs | Knowledge graph explorer with concept inspection |
| `/code` | Code Explorer | File tree + symbol outline powered by Rhizome |
| `/symbols` | Symbol Search | Global symbol search across the project |
| `/diagnostics` | Diagnostics | LSP diagnostics viewer (requires LSP backend) |
| `/analytics` | Analytics | Token savings charts from Mycelium |
| `/status` | Status | Ecosystem health for all three tools |

## Quick Start

```bash
npm install
npm run dev:all    # Starts frontend (localhost:5173) + backend (localhost:3001)
```

## Development

```bash
npm run dev           # Frontend only (Vite, localhost:5173)
npm run dev:server    # Backend only (Hono, localhost:3001)
npm run dev:all       # Both concurrently

npm run build         # Production build (tsc -b && vite build)
npm run preview       # Preview production build
npm run lint          # Biome check + auto-fix
```

## Stack

- **Frontend**: React 19, Mantine UI 8, React Router 7, Recharts, Vite 8, TypeScript 5.9
- **Backend**: Hono 4, better-sqlite3 (read-only), Pino logging
- **Linting**: Biome (not ESLint/Prettier)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `HYPHAE_DB` | `~/.local/share/hyphae/hyphae.db` | Path to Hyphae database |
| `HYPHAE_BIN` | `hyphae` | Hyphae CLI binary path |
| `MYCELIUM_BIN` | `mycelium` | Mycelium CLI binary path |
| `RHIZOME_BIN` | `rhizome` | Rhizome CLI binary path |
| `RHIZOME_PROJECT` | `process.cwd()` | Project root for Rhizome analysis |

## Ecosystem

Cap integrates three tools from the claude-mycelium ecosystem:

- **[Mycelium](https://github.com/williamnewton/claude-mycelium)** — Token compression proxy
- **[Hyphae](https://github.com/williamnewton/claude-mycelium)** — Persistent memory system (SQLite-backed)
- **[Rhizome](https://github.com/williamnewton/claude-mycelium)** — Code intelligence via tree-sitter/LSP (MCP over stdio)
