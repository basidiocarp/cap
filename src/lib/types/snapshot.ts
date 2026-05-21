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
