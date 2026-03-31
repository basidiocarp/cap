import type { HealthResult, MemoryRow, StatsResult, TopicSummary } from '../types.ts'
import {
  getHealthFromCli,
  getIngestionSourcesFromCli,
  getMemoriesByTopicFromCli,
  getMemoryFromCli,
  getStatsFromCli,
  getTopicsFromCli,
  recallFromCli,
  searchGlobalFromCli,
} from './reads-cli.ts'

export interface IngestionSource {
  chunk_count: number
  last_ingested: string | null
  source_path: string
}

export async function getStats(): Promise<StatsResult> {
  return getStatsFromCli()
}

export async function getTopics(): Promise<TopicSummary[]> {
  return getTopicsFromCli()
}

export async function recall(query: string, topic?: string, limit = 20): Promise<MemoryRow[]> {
  return recallFromCli(query, topic, limit)
}

export async function searchGlobal(query: string, limit = 20): Promise<Array<MemoryRow & { project?: string }>> {
  return searchGlobalFromCli(query, limit)
}

export async function getMemory(id: string): Promise<MemoryRow | undefined> {
  return getMemoryFromCli(id)
}

export async function getMemoriesByTopic(topic: string, limit = 50): Promise<MemoryRow[]> {
  return getMemoriesByTopicFromCli(topic, limit)
}

export async function getHealth(topic?: string): Promise<HealthResult[]> {
  return getHealthFromCli(topic)
}

export async function getIngestionSources(): Promise<IngestionSource[]> {
  return getIngestionSourcesFromCli()
}
