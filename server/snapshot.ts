import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { logger } from './logger.ts'

export interface SnapshotCard {
  id: string
  title: string
  repo: string
  status: string
  priority: string
  assignee: string | null
  created_at: string
  updated_at: string
  commit: string | null
}

export interface JournalEntry {
  at: string
  card_id: string
  from_status: string
  to_status: string
  note: string | null
}

export interface Snapshot {
  generated_at: string
  focus: SnapshotCard | null
  counts: Record<string, number>
  cards: SnapshotCard[]
  columns: Record<string, SnapshotCard[]>
  journal: JournalEntry[]
}

const KANBAN_GROUPS: Record<string, string[]> = {
  Done: ['Done', 'Skipped', 'Deferred', 'Complete'],
  'In Progress': ['In Progress', 'In Progress (Agent)', 'Pending'],
  'In Review': ['Stage 1', 'Stage 2'],
  'To Do': ['Ready', 'Blocked', 'Monitor'],
}

function kanbanColumn(status: string): string {
  for (const [col, statuses] of Object.entries(KANBAN_GROUPS)) {
    if (statuses.some((s) => status.toLowerCase().includes(s.toLowerCase()))) {
      return col
    }
  }
  return 'To Do'
}

function parseHandoffsMarkdown(content: string): SnapshotCard[] {
  const cards: SnapshotCard[] = []
  const lines = content.split('\n')
  let inActiveTable = false

  for (const line of lines) {
    if (line.includes('## Active Handoffs')) {
      inActiveTable = true
      continue
    }
    if (inActiveTable && line.startsWith('## ')) {
      inActiveTable = false
      continue
    }
    if (!inActiveTable) continue

    // Match table rows: | [title](link) | repo | priority | status |
    const match = line.match(/^\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/)
    if (!match) continue

    const [, title, repo, priority, status] = match
    if (title === 'Handoff' || title === '---') continue

    const id = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    cards.push({
      assignee: null,
      commit: null,
      created_at: new Date().toISOString(),
      id,
      priority: priority.trim(),
      repo: repo.trim(),
      status: status.trim(),
      title: title.trim(),
      updated_at: new Date().toISOString(),
    })
  }

  return cards
}

export async function assembleSnapshot(): Promise<Snapshot> {
  const handoffsPath = process.env.HANDOFFS_PATH ?? join(homedir(), '.handoffs', 'HANDOFFS.md')
  let cards: SnapshotCard[] = []

  try {
    const content = await readFile(handoffsPath, 'utf-8')
    cards = parseHandoffsMarkdown(content)
  } catch (err) {
    logger.warn({ err, path: handoffsPath }, 'HANDOFFS.md not found — returning empty snapshot')
  }

  const counts: Record<string, number> = {}
  for (const card of cards) {
    counts[card.status] = (counts[card.status] ?? 0) + 1
  }

  const columns: Record<string, SnapshotCard[]> = {
    Done: [],
    'In Progress': [],
    'In Review': [],
    'To Do': [],
  }
  for (const card of cards) {
    const col = kanbanColumn(card.status)
    columns[col].push(card)
  }

  const focus = cards.find((c) => kanbanColumn(c.status) !== 'Done') ?? null

  return {
    cards,
    columns,
    counts,
    focus,
    generated_at: new Date().toISOString(),
    journal: [],
  }
}
