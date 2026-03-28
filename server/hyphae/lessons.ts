import type { Lesson, MemoryRow } from '../types.ts'
import { getDb } from '../db.ts'

export function extractLessons(): Lesson[] {
  const db = getDb()
  if (!db) return []

  const lessons: Lesson[] = []
  const topicMemories = new Map<string, MemoryRow[]>()
  const topics = ['corrections', 'errors/resolved', 'tests/resolved']

  for (const topic of topics) {
    const memories = db.prepare(`SELECT * FROM memories WHERE topic = ? ORDER BY created_at DESC LIMIT 50`).all(topic) as MemoryRow[]

    if (memories.length > 0) {
      topicMemories.set(topic, memories)
    }
  }

  const corrections = topicMemories.get('corrections') || []
  const correctionGroups = new Map<string, MemoryRow[]>()

  for (const memory of corrections) {
    const keywords = memory.keywords ? (JSON.parse(memory.keywords) as string[]) : []
    const key = keywords.slice(0, 2).join('|') || memory.summary.slice(0, 20)
    let group = correctionGroups.get(key)
    if (!group) {
      group = []
      correctionGroups.set(key, group)
    }
    group.push(memory)
  }

  for (const [, items] of correctionGroups) {
    if (items.length >= 1) {
      lessons.push({
        category: 'corrections',
        description: items[0].summary,
        frequency: items.length,
        id: `correction-${lessons.length}`,
        keywords: items[0].keywords ? (JSON.parse(items[0].keywords) as string[]) : [],
        source_topics: ['corrections'],
      })
    }
  }

  const resolvedErrors = topicMemories.get('errors/resolved') || []
  const errorGroups = new Map<string, MemoryRow[]>()

  for (const memory of resolvedErrors) {
    const keywords = memory.keywords ? (JSON.parse(memory.keywords) as string[]) : []
    const key = keywords[0] || memory.summary.slice(0, 30)
    let group = errorGroups.get(key)
    if (!group) {
      group = []
      errorGroups.set(key, group)
    }
    group.push(memory)
  }

  for (const [, items] of errorGroups) {
    if (items.length >= 1) {
      lessons.push({
        category: 'errors',
        description: items[0].summary,
        frequency: items.length,
        id: `error-${lessons.length}`,
        keywords: items[0].keywords ? (JSON.parse(items[0].keywords) as string[]) : [],
        source_topics: ['errors/resolved'],
      })
    }
  }

  const resolvedTests = topicMemories.get('tests/resolved') || []
  const testGroups = new Map<string, MemoryRow[]>()

  for (const memory of resolvedTests) {
    const keywords = memory.keywords ? (JSON.parse(memory.keywords) as string[]) : []
    const key = keywords[0] || memory.summary.slice(0, 30)
    let group = testGroups.get(key)
    if (!group) {
      group = []
      testGroups.set(key, group)
    }
    group.push(memory)
  }

  for (const [, items] of testGroups) {
    if (items.length >= 1) {
      lessons.push({
        category: 'tests',
        description: items[0].summary,
        frequency: items.length,
        id: `test-${lessons.length}`,
        keywords: items[0].keywords ? (JSON.parse(items[0].keywords) as string[]) : [],
        source_topics: ['tests/resolved'],
      })
    }
  }

  return lessons.sort((a, b) => b.frequency - a.frequency)
}
