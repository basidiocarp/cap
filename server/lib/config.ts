import { homedir } from 'node:os'
import { join } from 'node:path'

export const ANNULUS_BIN = process.env.ANNULUS_BIN ?? 'annulus'
export const HYPHAE_BIN = process.env.HYPHAE_BIN ?? 'hyphae'
export const MYCELIUM_BIN = process.env.MYCELIUM_BIN ?? 'mycelium'
export const RHIZOME_BIN = process.env.RHIZOME_BIN ?? 'rhizome'
export const CANOPY_BIN = process.env.CANOPY_BIN ?? 'canopy'
export const RHIZOME_PROJECT = process.env.RHIZOME_PROJECT ?? process.cwd()
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

// ─────────────────────────────────────────────────────────────────────────────
// Database Paths
// ─────────────────────────────────────────────────────────────────────────────

export const CANOPY_DB = process.env.CANOPY_DB ?? join(homedir(), '.local', 'share', 'canopy', 'canopy.db')
export const CAP_DB = process.env.CAP_DB ?? join(homedir(), '.local', 'share', 'cap', 'cap.db')

// ─────────────────────────────────────────────────────────────────────────────
// Network Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const CAP_HOST = process.env.CAP_HOST ?? '127.0.0.1'
export const CAP_API_KEY = process.env.CAP_API_KEY ?? undefined
