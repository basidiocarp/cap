# Cap Backend Testing

## Overview

Cap now has a basic unit test suite covering the backend server components. Tests verify cache utilities, registry management, and API route response shapes.

## What's Tested

### 1. RhizomeRegistry (`server/__tests__/rhizome-registry.test.ts`)

Tests the Rhizome client pool manager:

- `getActive()` returns a client for the default project
- `getActiveProject()` reflects the current active project
- `switchProject()` changes the active project
- `getRecentProjects()` returns the project history (with deduplication and 10-item cap)
- Client lifecycle (creation, eviction, destruction)

**Key behaviors verified**:
- Recent projects deduplicate on switch
- Recent projects cap at 10 items
- Same client returned for repeated `getActive()` calls
- Clients are evicted when pool reaches capacity

### 2. Cache Utilities (`server/__tests__/cache.test.ts`)

Tests TTL-based memoization:

**`cached()` for synchronous functions**:
- Returns same value within TTL
- Refreshes after TTL expires
- Maintains separate caches per instance
- Handles different return types

**`cachedAsync()` for async functions**:
- Returns same value within TTL
- Refreshes after TTL expires
- Deduplicates concurrent requests (only one call while pending)
- Handles errors without caching them
- Allows retry after error
- Maintains separate caches per instance

### 3. API Routes (`server/__tests__/api.test.ts`)

Tests HTTP endpoints using Hono's test client:

**`GET /api/health`**:
- Returns 200 status
- Response body: `{ status: 'ok' }`

**`GET /api/settings`**:
- Returns 200 status
- Response contains `hyphae`, `mycelium`, `rhizome` keys
- `hyphae`: `{ config_path, db_path, db_size_bytes }`
- `mycelium`: `{ config_path, filters: { hyphae: { enabled }, rhizome: { enabled } } }`
- `rhizome`: `{ auto_export, config_path, languages_enabled }`
- Works even if tools are not installed (returns default values)

**Error handling**:
- 404 responses for non-existent routes
- CORS headers in responses

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Run specific test file
npm test server/__tests__/cache.test.ts
```

## Configuration

- **Framework**: Vitest 2.1.8
- **Environment**: Node.js
- **Config file**: `vitest.config.ts`
- **Test files**: `server/__tests__/**/*.test.ts`

## Implementation Notes

### RhizomeRegistry

The actual registry class in `server/lib/rhizome-registry.ts` is not exported. The test implements a mock class that mirrors the actual implementation. If the registry is exported in the future, switch to:

```typescript
import { registry } from '../lib/rhizome-registry.ts'
```

### No Subprocess Spawning

Tests mock `RhizomeClient.prototype.destroy` to prevent spawning the actual Rhizome binary. This keeps tests fast and isolated.

### API Tests

The `createApp()` factory is tested directly with Hono's request/response objects. This verifies route definitions and basic response shapes without requiring a running server.

## Future Improvements

- [ ] Add tests for more API endpoints (hyphae routes, mycelium routes, etc.)
- [ ] Add tests for CLI runners and error cases
- [ ] Add tests for database query layer
- [ ] Achieve 80%+ code coverage
- [ ] Add integration tests with actual subprocess management
- [ ] Test cross-platform shell escaping in CLI runners

## Coverage

Current test coverage is basic. Priority is to test:
1. RhizomeRegistry (critical — manages subprocess pool)
2. Cache utilities (important — used throughout)
3. API route response shapes (important — frontend contract)

See `server/__tests__/README.md` for detailed test documentation.
