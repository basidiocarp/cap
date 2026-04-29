# Cap Node Supply Chain Policy

> Applies to all Cap contributors and automation scripts.

---

## Install Commands

| Context | Command | Reason |
|---------|---------|--------|
| CI / release | `npm ci` | Reproducible install; fails if lockfile is stale |
| Local dev — first setup | `npm ci` | Preferred; matches CI |
| Local dev — adding a dependency | `npm install <pkg>` | Required to update lockfile; commit the updated `package-lock.json` |

**Never use `npm install` in CI or release scripts.** It can silently upgrade packages when the lockfile is out of date.

---

## npx Policy

npm scripts in `package.json` and automation scripts (`scripts/`) must not use bare `npx <pkg>` to invoke tools. `npx` can fall back to the registry if the package is absent or if the version is mismatched, bypassing the lockfile.

**Preferred invocation in npm scripts**: just call the binary name — npm automatically adds `node_modules/.bin/` to `PATH` when executing scripts:

```json
"lint": "biome check --write ."
```

**Preferred invocation in shell scripts**: use `npm exec --offline --` to force resolution from the local install and prevent any network fallback:

```bash
npm exec --offline -- biome check .
npm exec --offline -- tsc --noEmit
```

If a tool genuinely does not belong in `package.json` (e.g., a one-off workspace helper), add a comment justifying the use of `npx` at the call site.

---

## Native Dependency Allowlist

Cap includes packages that build native binaries during `npm ci`. These are pre-approved:

| Package | Reason |
|---------|--------|
| `better-sqlite3` | SQLite client with native bindings; required for Cap's local DB |
| `esbuild` | Vite build dependency; platform-specific binary is pre-built, not compiled |
| `@rollup/rollup-<platform>` | Rollup platform binary; pre-built, fetched by Vite at install time |
| `fsevents` | macOS file watcher; optional native dep, skips gracefully on non-macOS |

To add a new native dependency, document it in this table with its justification before merging.

---

## Release Gate

`scripts/release.sh` enforces the following quality checks before tagging a release. All must pass:

1. `biome check .` — lint and format (via `npm exec --offline --`)
2. `tsc --noEmit` — frontend type check
3. `tsc --noEmit -p server/tsconfig.json` — server type check
4. `npm run build` — full build

**Tests are not currently part of the release script gate.** The full test suite (`npm test`) must be run and confirmed green by the operator before invoking the release script. This is a manual step. The release script is intentionally kept fast by omitting the full test run; the test suite is the operator's responsibility before starting a release.

If this policy changes, update both this doc and `scripts/release.sh`.

---

## Validation

To check that no new unqualified `npx` usage has crept into scripts or package.json:

```bash
# Should print nothing (no bare npx calls in package.json scripts)
node -e "const p=require('./package.json');const s=JSON.stringify(p.scripts);const m=s.match(/npx\s+@?[a-z]/g);if(m){console.error('bare npx found:',m);process.exit(1)}"

# Should print nothing (no bare npx calls in release script)
grep -nE 'npx\s' scripts/release.sh && echo "bare npx found" || echo "clean"
```
