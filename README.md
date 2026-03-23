# Cap

Web dashboard for the [claude-mycelium](https://github.com/williamnewton/claude-mycelium) ecosystem. One interface for
Hyphae memories, Mycelium token savings, and Rhizome code intelligence.

## Pages

| Route          | Page          | What it does                                               |
|----------------|---------------|------------------------------------------------------------|
| `/`            | Dashboard     | Memory stats, topic breakdown, health overview             |
| `/memories`    | Memories      | Full-text search and filter memories                       |
| `/memoirs`     | Memoirs       | Knowledge graph explorer with concept inspection           |
| `/code`        | Code Explorer | File tree + symbol outline via Rhizome                     |
| `/symbols`     | Symbol Search | Global symbol search across the project                    |
| `/diagnostics` | Diagnostics   | LSP diagnostics viewer (requires LSP backend)              |
| `/onboard`     | Onboarding    | Setup guidance and fix commands for a fresh ecosystem      |
| `/analytics`   | Analytics     | Token savings, memory health, and code intelligence charts |
| `/status`      | Status        | Ecosystem health for all three tools                       |

## Quick start

```bash
npm install
npm run dev:all    # Frontend (localhost:5173) + backend (localhost:3001)
```

## Development

```bash
npm run dev           # Frontend only (Vite)
npm run dev:server    # Backend only (Hono)
npm run dev:all       # Both concurrently

npm run build         # tsc -b && vite build
npm run preview       # Preview production build
npm run lint          # Biome check + auto-fix
```

## Stack

Frontend: React 19, Mantine UI 8, React Router 7, TanStack Query, Recharts, Vite 8, TypeScript 5.9
Backend: Hono 4, better-sqlite3 (read-only), Pino logging
Linting: Biome (not ESLint/Prettier)

## Environment variables

| Variable          | Default                           | Description                       |
|-------------------|-----------------------------------|-----------------------------------|
| `PORT`            | `3001`                            | Backend server port               |
| `HYPHAE_DB`       | `~/.local/share/hyphae/hyphae.db` | Hyphae database path              |
| `HYPHAE_BIN`      | `hyphae`                          | Hyphae CLI binary                 |
| `MYCELIUM_BIN`    | `mycelium`                        | Mycelium CLI binary               |
| `RHIZOME_BIN`     | `rhizome`                         | Rhizome CLI binary                |
| `RHIZOME_PROJECT` | `process.cwd()`                   | Project root for Rhizome analysis |

## Ecosystem

Cap ties together three tools from [claude-mycelium](https://github.com/williamnewton/claude-mycelium):

- [Mycelium](https://github.com/williamnewton/claude-mycelium) — token compression proxy
- [Hyphae](https://github.com/williamnewton/claude-mycelium) — persistent memory (SQLite-backed)
- [Rhizome](https://github.com/williamnewton/claude-mycelium) — code intelligence via tree-sitter/LSP (MCP over stdio)
