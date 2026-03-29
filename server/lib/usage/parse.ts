import { join } from 'node:path'

import type { SessionUsage } from './types.ts'
import { parseClaudeSessionUsage } from './parse-claude.ts'
import { parseCodexSessionUsage } from './parse-codex.ts'

export function parseSessionUsage(transcriptPath: string): SessionUsage | null {
  if (transcriptPath.includes(`${join('.codex', 'sessions')}`)) {
    return parseCodexSessionUsage(transcriptPath)
  }

  return parseClaudeSessionUsage(transcriptPath)
}
