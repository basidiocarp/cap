import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import type { SessionUsage } from './types.ts'
import { parseSessionUsage } from './parse.ts'

function collectSessionFiles(root: string, files: string[] = []): string[] {
  if (!existsSync(root)) return files

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const filePath = join(root, entry.name)
    if (entry.isDirectory()) {
      collectSessionFiles(filePath, files)
      continue
    }

    if (entry.isFile() && filePath.endsWith('.jsonl')) {
      files.push(filePath)
    }
  }

  return files
}

/**
 * Returns true when `since` is a non-empty string that parses to a valid date.
 * Used to reject NaN-producing inputs (e.g. "foo") before filtering.
 */
export function isValidSince(since: string): boolean {
  return Number.isFinite(new Date(since).getTime())
}

export function scanAllSessions(since?: string): SessionUsage[] {
  const sessions: SessionUsage[] = []
  const roots = [join(homedir(), '.claude', 'projects'), join(homedir(), '.codex', 'sessions')]

  try {
    for (const root of roots) {
      for (const filePath of collectSessionFiles(root)) {
        const usage = parseSessionUsage(filePath)
        if (usage) sessions.push(usage)
      }
    }
  } catch {
    // ignore read errors
  }

  sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Filter by session timestamp (ISO string comparison) rather than file mtime.
  // mtime can be updated by unrelated file operations and does not reliably
  // reflect when the session was recorded; timestamp is the authoritative value.
  if (since) {
    return sessions.filter((s) => s.timestamp >= since)
  }

  return sessions
}
