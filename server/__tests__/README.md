# Cap Backend Tests

Unit and integration tests for the Cap backend server.

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch
```

## Test Organization

### rhizome-registry.test.ts

Tests for the RhizomeRegistry class, which manages a pool of Rhizome clients:

- `getActive()` — returns a client for the current project
- `switchProject()` — changes the active project and tracks recent projects
- Recent projects list — caps at 10 items, deduplicates

### cache.test.ts

Tests for cache utilities:

- `cached()` — TTL-based memoization for synchronous functions
- `cachedAsync()` — TTL-based memoization for async functions with request deduplication

### api.test.ts

Tests for API routes using Hono's test client:

- `GET /api/health` — always returns 200 with status ok
- `GET /api/settings` — returns configuration for Hyphae, Mycelium, and Rhizome
- Error handling — 404s and CORS headers

## Test Strategy

**Unit tests**: Test individual functions in isolation with mocked dependencies

**Integration tests**: Test API routes using Hono's request/response objects

**No subprocess spawning**: Mocked RhizomeClient to avoid spawning the Rhizome binary

## Coverage Target

80% minimum coverage on:
- Server library functions (cache, registry, CLI runners)
- API route logic (excluding external subprocess calls)

## Notes

The RhizomeRegistry test creates a mock class that mirrors the actual implementation
in `server/lib/rhizome-registry.ts` since that class is not currently exported.
If the registry is exported in the future, switch to importing the real class.
