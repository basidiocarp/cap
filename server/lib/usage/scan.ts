import { existsSync, readdirSync, statSync } from 'node:fs'
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

export function scanAllSessions(since?: string): SessionUsage[] {
  const sessions: SessionUsage[] = []
  const roots = [join(homedir(), '.claude', 'projects'), join(homedir(), '.codex', 'sessions')]
  const sinceTs = since ? new Date(since).getTime() : 0

  try {
    for (const root of roots) {
      for (const filePath of collectSessionFiles(root)) {
        if (sinceTs > 0) {
          try {
            const mtime = statSync(filePath).mtime.getTime()
            if (mtime < sinceTs) continue
          } catch {
            continue
          }
        }

        const usage = parseSessionUsage(filePath)
        if (usage) sessions.push(usage)
      }
    }
  } catch {
    // ignore read errors
  }

  sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return sessions
}
