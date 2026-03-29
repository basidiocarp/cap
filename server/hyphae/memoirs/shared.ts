import type { MemoirRow } from '../../types.ts'
import { getDb } from '../../db.ts'

export function findMemoirByName(name: string): MemoirRow | null {
  const db = getDb()
  if (!db) return null
  return (db.prepare('SELECT * FROM memoirs WHERE name = ?').get(name) as MemoirRow | undefined) ?? null
}
