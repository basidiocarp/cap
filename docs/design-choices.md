# Cap Design Choices

## Color Palette

Every color name comes from fungal biology, matching the monorepo's mycological naming. The names carry domain meaning: a developer reading `color='decay'` on a health bar knows what it means without checking a style guide.

### Palette Reference

| Name | Hex Range (0–9) | Inspiration | UI Mapping |
|------|------------------|-------------|------------|
| mycelium | `#e6fcf5` → `#087f5b` | Underground fungal network | Primary, healthy states, growth, positive trends |
| spore | `#f3f0ff` → `#5f3dc4` | Reproductive dispersal | Accent, graph edges, outgoing connections |
| substrate | `#fff8e1` → `#ff6f00` | Growth medium / earth | Warnings, medium-priority, weight decay caution |
| chitin | `#f0f4f8` → `#102a43` | Fungal cell wall | Neutral/secondary, borders, structural UI |
| gill | `#fff0f0` → `#9c3535` | Mushroom lamellae | Critical alerts, errors, destructive actions |
| hymenium | `#fef9e7` → `#86620d` | Spore-bearing surface | Highlights, confidence scores, gold accents |
| fruiting | `#fff3e0` → `#e65100` | Visible mushroom body ("cap") | High-priority, dependencies, active sessions |
| decay | `#fbe9e7` → `#5c1a0b` | Decomposition cycle | Errors, fading memories, superseded concepts |
| lichen | `#e0f7fa` → `#006064` | Symbiotic organism | Symbiotic links, search results, "part of" relations |

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

### Why fungal naming?

The monorepo already uses mycological names (mycelium, hyphae, cap, spore, rhizome), so the palette extends that into the visual layer. Generic names like "red" carry no domain meaning; `decay` on a health bar is self-documenting.

Each palette is a 10-shade Mantine tuple designed for dark mode first. Shade indices 5–7 are optimized for contrast against dark backgrounds.

## Typography

| Role | Font | Rationale |
|------|------|-----------|
| Body | Roboto | Legible at small sizes, good for data-dense dashboards |
| Headings | Roboto | Same family as body; weight 500 provides hierarchy |
| Monospace | JetBrains Mono Variable | Built for code, ligatures, variable weight |

## Architecture Decisions

### Direct SQLite for reads, CLI for writes

Cap reads Hyphae's SQLite database directly (read-only, WAL mode) for fast queries. Writes (store, forget, consolidate) shell out to the `hyphae` CLI so validation logic stays in one place.

### Mantine as component library

Mantine v8 provides a dark-mode component system without additional configuration. Theme composition uses `createTheme` + `mergeThemeOverrides` with separate files for typography, colors, spacing, etc. The semantic color names (`decay`, `mycelium`, not `red`, `green`) are the stable contract; if the component library changes later, the color assignments carry over.
