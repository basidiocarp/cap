# Changelog

## v0.2.0

### Features
- **Rhizome integration**: MCP client for code intelligence, persistent subprocess with JSON-RPC over stdio (`568ee98`)
- **Code Explorer page** (`/code`): Two-panel file tree + symbol outline with definition preview
- **Symbol Search page** (`/symbols`): Debounced global symbol search across project
- **Diagnostics page** (`/diagnostics`): LSP diagnostics grouped by file with severity badges
- **Ecosystem Status page** (`/status`): Unified health view for Mycelium, Hyphae, and Rhizome with auto-refresh
- **Rhizome API routes**: 9 endpoints proxying MCP tool calls (symbols, structure, definition, search, references, diagnostics, hover, files, status)
- **Ecosystem status route**: Aggregated health from all three tools with 30s cache
- **Enhanced analytics**: Hyphae, Mycelium, and Rhizome data with tabbed layout and ring progress charts (`a59ad5e`)
- **Fungal color palette**: 9 custom Mantine color tuples (mycelium, spore, substrate, chitin, gill, hymenium, fruiting, decay, lichen) with semantic mappings
- **Typography**: Roboto for body/headings, JetBrains Mono Variable for monospace
- **Sectioned navigation**: Sidebar organized into Memory, Code, and System sections

### Improvements
- All page colors updated to use ecosystem-themed palette instead of hardcoded hex values
- Theme system modularized (colors, typography, shadows, spacing, interactions, tokens, components)
- Header subtitle changed from "memory dashboard" to "ecosystem dashboard"
- Mobile-responsive file tree with collapse toggle (`1e6d948`)

### Documentation
- Added `docs/design-choices.md` documenting color palette, typography, and architecture decisions
- Updated `README.md`

### CI
- Added GitHub Actions CI workflow (`deb7d9e`)

## v0.1.0

### Features
-  initial cap dashboard with hyphae SQLite integration (`d740aac`)

### Chores
-  fix biome lint issues and migrate config to v2.4.6 (`86b4408`)
