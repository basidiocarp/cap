# Cap Roadmap

This page is the Cap-specific backlog. The workspace [ROADMAP.md](../../docs/workspace/ROADMAP.md) keeps the ecosystem sequencing and cross-repo priorities.

## Recently Shipped

- Cap now covers the core operator surfaces instead of just setup views. Onboarding, status, analytics, settings, sessions, lessons, code explorer, memoirs, and memories all ship in one coherent dashboard.
- The host model is broader than a single Claude-only setup. Cap now reflects Claude and Codex coexistence, shared path resolution, and path provenance in Settings and Status.
- Empty states and remediation guidance are much stronger than the first pass. Operators can usually tell what is missing and what tool owns the fix without reading repo docs first.
- The UI now has a frontend interaction harness and broader Rhizome integration. That makes the dashboard less fragile as the ecosystem surfaces grow.

## Next

### Session timeline

Cap needs a timeline that joins recalls, errors, fixes, tests, exports, and summaries into one readable flow. This should stay aligned with the ecosystem roadmap because it becomes the main operator window into Hyphae, Cortina, and Mycelium state.

### Repair actions

The dashboard still stops at explanation in places where the ecosystem could repair itself. The next pass should add deeper repair actions so onboarding, status, and settings surfaces can hand work directly to Stipe when a safe fix exists.

### Project analytics

Global totals are not enough anymore. Cap needs stronger project-scoped analytics so operators can see which repo, host, or workflow is driving usage, savings, and instability.

### Provenance consistency

Resolved-path provenance should appear anywhere Cap shows config or storage locations. The goal is simple: every path the UI displays should tell the operator where it came from and why it is the one in use.

## Later

### Memory usefulness

Cap should show which recalled memories helped, which ones were stale, and which ones added noise. That view matters once Hyphae's outcome-linked ranking is far enough along to support real operator decisions.

### Code intelligence views

The dashboard should eventually surface architecture graphs, impact maps, and changed-symbol history from Rhizome. That work makes more sense after the underlying code intelligence APIs settle down.

### ROI analytics

Raw counts are only the first layer. Over time, Cap should move toward ROI views that connect token savings, repair time, recall usefulness, and session outcomes across the ecosystem.

### Stipe remediation

Deeper `stipe` remediation flows belong here once the current repair actions are proven. Cap should become the easiest place to see a problem and hand it to the right installer or doctor command.

## Research

### Remote operator surfaces

The local dashboard is the priority. A remote dashboard or desktop app only makes sense once the local operator workflow is complete enough that copying it elsewhere would be an expansion, not a distraction.
