# Cap Design Choices

## Color Palette

Cap's color system is built around fungal biology, creating semantic meaning that maps directly to the data being
visualized. Every color name is drawn from the mycological ecosystem that ties the monorepo together.

### Palette Reference

| Name          | Hex Range (0–9)       | Inspiration                       | UI Mapping                                                              |
|---------------|-----------------------|-----------------------------------|-------------------------------------------------------------------------|
| **mycelium**  | `#e6fcf5` → `#087f5b` | Underground fungal network        | Primary color, healthy states, growth indicators, positive trends       |
| **spore**     | `#f3f0ff` → `#5f3dc4` | Reproductive dispersal            | Accent, knowledge graph edges, outgoing connections                     |
| **substrate** | `#fff8e1` → `#ff6f00` | Growth medium / earth             | Warnings, medium-priority items, weight decay caution                   |
| **chitin**    | `#f0f4f8` → `#102a43` | Fungal cell wall structure        | Neutral/secondary, borders, low-priority items, structural UI           |
| **gill**      | `#fff0f0` → `#9c3535` | Mushroom lamellae (underside)     | Critical alerts, errors, contradictions, destructive actions            |
| **hymenium**  | `#fef9e7` → `#86620d` | Spore-bearing surface             | Highlights, confidence scores, gold accents                             |
| **fruiting**  | `#fff3e0` → `#e65100` | Visible mushroom body (the "cap") | High-priority items, dependencies, active sessions                      |
| **decay**     | `#fbe9e7` → `#5c1a0b` | Decomposition cycle               | Error states, fading memories, superseded concepts, low health          |
| **lichen**    | `#e0f7fa` → `#006064` | Symbiotic organism                | Symbiotic links, medium importance, search results, "part of" relations |

### Semantic Color Assignments

#### Memory Importance

| Level    | Color      | Rationale                                                             |
|----------|------------|-----------------------------------------------------------------------|
| Critical | `gill`     | Demands attention, like the vivid underside of a toxic mushroom       |
| High     | `fruiting` | Prominent and visible, like the fruiting body emerging from substrate |
| Medium   | `lichen`   | Stable and symbiotic, not urgent but persistent                       |
| Low      | `chitin`   | Structural background, present but not prominent                      |

#### Memory Health

| State                    | Color       | Rationale                               |
|--------------------------|-------------|-----------------------------------------|
| Healthy (weight > 0.7)   | `mycelium`  | Thriving underground network            |
| Caution (weight 0.4–0.7) | `substrate` | The medium is shifting, needs attention |
| Fading (weight < 0.4)    | `decay`     | Natural decomposition in progress       |

#### Knowledge Graph Relations

| Relation     | Color       | Rationale                                             |
|--------------|-------------|-------------------------------------------------------|
| DependsOn    | `fruiting`  | Visible dependency, like a cap depending on its stipe |
| PartOf       | `lichen`    | Symbiotic containment                                 |
| Contradicts  | `gill`      | Warning, conflict                                     |
| Refines      | `mycelium`  | Growth, improvement                                   |
| CausedBy     | `substrate` | The medium from which something grew                  |
| SupersededBy | `decay`     | Replaced, decomposing                                 |

#### Graph Direction

| Direction | Color    | Rationale                   |
|-----------|----------|-----------------------------|
| Outgoing  | `spore`  | Dispersal, sending out      |
| Incoming  | `lichen` | Receiving, symbiotic intake |

#### Chart Colors

| Element                   | Hex       | Source                                     |
|---------------------------|-----------|--------------------------------------------|
| Line stroke / Output bars | `#0ca678` | `mycelium.7` — primary data, token savings |
| Input bars                | `#627d98` | `chitin.5` — secondary/reference data      |

### Why Fungal Naming?

1. **Consistency** — The entire monorepo uses mycological naming (mycelium, hyphae, cap, spore, rhizome). The color
   palette extends this into the visual layer.

2. **Semantic clarity** — Generic names like "red" and "blue" carry no domain meaning. `decay` immediately communicates
   what the color represents in context. A developer reading `color='decay'` in a health progress bar understands the
   intent without checking a style guide.

3. **Dark mode native** — Each palette was designed as a 10-shade tuple (Mantine convention) with dark-mode readability
   as the primary target. Shade indices 5–7 are optimized for contrast against dark backgrounds.

## Typography

| Role      | Font                    | Rationale                                                                                   |
|-----------|-------------------------|---------------------------------------------------------------------------------------------|
| Body      | Roboto                  | Clean, highly legible at small sizes, excellent for data-dense dashboards                   |
| Headings  | Roboto                  | Consistency with body text, weight differentiation (500) provides hierarchy                 |
| Monospace | JetBrains Mono Variable | Purpose-built for code and data, ligatures for readability, variable weight for flexibility |

## Architecture Decisions

### Direct SQLite for reads, CLI for writes

Cap reads hyphae's SQLite database directly (read-only, WAL mode) for maximum performance on the read path. Write
operations (store, forget, consolidate) shell out to the hyphae CLI to reuse its validation logic without duplicating it
in TypeScript. See `docs/plans.txt` for the full rationale.

### Mantine as component library

Mantine v8 provides a complete dark-mode component system with minimal configuration. The `createTheme` +
`mergeThemeOverrides` pattern allows modular theme composition (typography, colors, spacing, etc. in separate files). If
Mantine becomes a performance bottleneck, the semantic color names make migration straightforward — the color
assignments are the contract, not the framework.
