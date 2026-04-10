# Cap Agent Notes

## Purpose

Cap is the operator dashboard for the Basidiocarp ecosystem. Work here should keep the frontend focused on operator UX and the backend focused on boundary adapters. Cap renders and brokers sibling-tool state; it should not become another state owner.

---

## Source of Truth

- `src/`: frontend routes, components, and query surfaces.
- `server/routes/`: HTTP route families and boundary handlers.
- `server/`: sibling-tool adapters, read paths, and server wiring.
- `docs/`: repo-local usage and implementation notes.
- `../septa/`: authoritative schemas for sibling-tool payloads that Cap consumes.

If a route mirrors a sibling tool's contract, update the matching `../septa/` schema first.

---

## Before You Start

Before writing code, verify:

1. **Owning layer**: decide whether the change belongs in the frontend, the server adapter layer, or both.
2. **Contracts**: if a route consumes versioned JSON from a sibling tool, read the matching `../septa/` schema first.
3. **Boundary**: keep direct DB reads narrow and explicit; prefer owned adapters over ad hoc shelling out.
4. **Validation target**: decide whether the change needs frontend tests, backend checks, or both.
5. **Docs impact**: if route shape or operator behavior changes, update the relevant docs page.

---

## Preferred Commands

Use these for most work:

```bash
npm run build
npm test
npm run lint
```

For targeted work:

```bash
npm run dev
npm run dev:server
npm run dev:all
```

---

## Repo Architecture

Cap is healthiest when the UI, server, and sibling-tool adapters stay in separate layers.

Key boundaries:

- `src/`: operator-facing UI, state, and typed client calls.
- `server/routes/`: normalized HTTP responses for the frontend.
- sibling adapters under `server/`: Hyphae, Mycelium, Rhizome, Canopy, and Stipe read or write-through boundaries.
- direct DB access: narrow, explicit, and read-oriented unless the route is deliberately brokering an action.

Current direction:

- Keep the backend as a boundary broker, not a second state owner.
- Keep operator actions explicit and traceable.
- Keep route typing visible to both server and frontend code.

---

## Working Rules

- Do not write directly to sibling databases unless the repo already owns that boundary and the route is explicitly designed for it.
- Keep backend normalization and frontend presentation concerns separate.
- When a route mirrors a sibling contract, update the schema, route, and UI together.
- Prefer real sibling-tool output or fixtures over invented mock payloads when behavior is boundary-sensitive.
- Update docs when a public route or operator workflow changes.

---

## Multi-Agent Patterns

For substantial Cap work, default to two agents:

**1. Primary implementation worker**
- Owns the frontend, backend, or route-specific write scope
- Keeps the change inside Cap unless a real contract update requires `../septa/`

**2. Independent validator**
- Reviews the broader shape instead of redoing the implementation
- Specifically looks for boundary leakage, stale route typing, direct-state ownership mistakes, and missed contract updates

Add a docs worker when `README.md`, `CLAUDE.md`, `AGENTS.md`, or public docs changed materially.

---

## Skills to Load

Use these for most work in this repo:

- `basidiocarp-cap`: repo-local React, TypeScript, and server workflow
- `writing-voice`: when touching README or docs prose
- `systematic-debugging`: before fixing unexplained UI or server failures

Use these when the task needs them:

- `test-writing`: when route or UI behavior changes need stronger coverage
- `basidiocarp-workspace-router`: when the change may spill into `septa` or another repo
- `tool-preferences`: when exploration should stay tight

---

## Done Means

A task is not complete until:

- [ ] The change is in the right frontend or server layer
- [ ] The narrowest relevant validation has run, when practical
- [ ] Related schemas, docs, or route types are updated if they should move together
- [ ] Any skipped validation or follow-up work is stated clearly in the final response

If validation was skipped, say so clearly and explain why.
