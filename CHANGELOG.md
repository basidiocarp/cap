# Changelog

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
