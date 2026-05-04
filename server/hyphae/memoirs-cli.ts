import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { logger } from '../logger.ts'

const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')
const MEMOIR_PAGE_SIZE = 500
const SEARCH_PAGE_SIZE = 500
const MEMOIR_LIST_SCHEMA_VERSION = '1.0'
const MEMOIR_SHOW_SCHEMA_VERSION = '1.0'
const MEMOIR_SEARCH_SCHEMA_VERSION = '1.0'
const MEMOIR_SEARCH_ALL_SCHEMA_VERSION = '1.0'
const MEMOIR_INSPECT_SCHEMA_VERSION = '1.0'

interface Memoir {
  consolidation_threshold: number
  created_at: string
  description: string
  id: string
  name: string
  updated_at: string
}

interface Concept {
  community_id: string | null
  confidence: number
  created_at: string
  definition: string
  id: string
  labels: string
  memoir_id: string
  name: string
  revision: number
  source_memory_ids: string
  updated_at: string
}

interface ConceptLink {
  created_at: string
  id: string
  relation: string
  source_id: string
  target_id: string
  weight: number
}

interface MemoirDetail {
  concepts: Concept[]
  limit: number
  memoir: Memoir
  offset: number
  query?: string | null
  total_concepts: number
}

interface ConceptInspection {
  concept: Concept
  neighbors: Array<{ concept: Concept; direction: 'incoming' | 'outgoing'; link: ConceptLink }>
}

interface RawMemoir {
  consolidation_threshold: number
  created_at: string
  description: string
  id: string
  name: string
  updated_at: string
}

interface RawLabel {
  namespace: string
  value: string
}

interface RawConcept {
  community_id: string | null
  confidence: number
  created_at: string
  definition: string
  id: string
  labels: RawLabel[]
  memoir_id: string
  name: string
  revision: number
  source_memory_ids: string[]
  updated_at: string
}

interface RawConceptLink {
  created_at: string
  id: string
  relation: string
  source_id: string
  target_id: string
  weight: number
}

interface RawMemoirListPayload {
  memoirs: Array<{
    concept_count: number
    link_count: number
    memoir: RawMemoir
  }>
}

interface RawMemoirShowPayload {
  concepts: RawConcept[]
  limit: number
  memoir: RawMemoir
  offset: number
  query?: string | null
  stats: {
    avg_confidence: number
    label_counts: Array<{ count: number; label: string }>
    total_concepts: number
    total_links: number
  }
  total: number
}

interface RawMemoirSearchPayload {
  limit: number
  memoir?: RawMemoir | null
  offset: number
  query: string
  results: RawConcept[]
  total: number
}

interface RawMemoirSearchAllPayload {
  limit: number
  offset: number
  query: string
  results: Array<{
    concept: RawConcept
    memoir: RawMemoir
  }>
  total: number
}

interface RawMemoirInspectPayload {
  concept: RawConcept
  depth: number
  memoir: RawMemoir
  neighborhood: {
    concepts: RawConcept[]
    links: RawConceptLink[]
  }
}

export class HyphaeMemoirCliError extends Error {
  kind: 'invalid_payload' | 'not_found' | 'unavailable'

  constructor(message: string, kind: 'invalid_payload' | 'not_found' | 'unavailable', options?: { cause?: unknown }) {
    super(message, options)
    this.kind = kind
    this.name = 'HyphaeMemoirCliError'
  }
}

function isRawMemoir(value: unknown): value is RawMemoir {
  if (!value || typeof value !== 'object') return false
  const memoir = value as Record<string, unknown>
  return (
    typeof memoir.id === 'string' &&
    typeof memoir.name === 'string' &&
    typeof memoir.description === 'string' &&
    typeof memoir.created_at === 'string' &&
    typeof memoir.updated_at === 'string' &&
    typeof memoir.consolidation_threshold === 'number'
  )
}

function isRawLabel(value: unknown): value is RawLabel {
  if (!value || typeof value !== 'object') return false
  const label = value as Record<string, unknown>
  return typeof label.namespace === 'string' && typeof label.value === 'string'
}

function isRawConcept(value: unknown): value is RawConcept {
  if (!value || typeof value !== 'object') return false
  const concept = value as Record<string, unknown>
  return (
    typeof concept.id === 'string' &&
    typeof concept.memoir_id === 'string' &&
    typeof concept.name === 'string' &&
    typeof concept.definition === 'string' &&
    Array.isArray(concept.labels) &&
    concept.labels.every(isRawLabel) &&
    typeof concept.confidence === 'number' &&
    typeof concept.revision === 'number' &&
    typeof concept.created_at === 'string' &&
    typeof concept.updated_at === 'string' &&
    Array.isArray(concept.source_memory_ids) &&
    concept.source_memory_ids.every((value) => typeof value === 'string') &&
    (concept.community_id === undefined || concept.community_id === null || typeof concept.community_id === 'string')
  )
}

function isRawConceptLink(value: unknown): value is RawConceptLink {
  if (!value || typeof value !== 'object') return false
  const link = value as Record<string, unknown>
  return (
    typeof link.id === 'string' &&
    typeof link.source_id === 'string' &&
    typeof link.target_id === 'string' &&
    typeof link.relation === 'string' &&
    typeof link.weight === 'number' &&
    typeof link.created_at === 'string'
  )
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function parseJson<T>(stdout: string, validator: (value: unknown) => value is T, label: string): T {
  try {
    const parsed = JSON.parse(stdout) as unknown
    const record = asRecord(parsed)
    if (!record || typeof record.schema_version !== 'string' || !validator(parsed)) {
      throw new HyphaeMemoirCliError(`Hyphae ${label} returned an invalid payload`, 'invalid_payload')
    }
    return parsed
  } catch (err) {
    logger.debug({ err }, `Failed to parse Hyphae ${label} CLI output`)
    if (err instanceof HyphaeMemoirCliError) throw err
    throw new HyphaeMemoirCliError(`Failed to parse Hyphae ${label} CLI output`, 'invalid_payload', { cause: err })
  }
}

function errorText(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err)
  const maybe = err as { message?: string; stderr?: string }
  return [maybe.stderr, maybe.message].filter((value): value is string => Boolean(value)).join('\n')
}

function memoirNotFound(err: unknown): boolean {
  return /memoir not found/i.test(errorText(err))
}

function conceptNotFound(err: unknown): boolean {
  return /concept not found/i.test(errorText(err))
}

async function runMemoirCli(args: string[], label: string): Promise<string> {
  try {
    return await runCli(['memoir', ...args])
  } catch (err) {
    logger.debug({ err }, `Failed to load Hyphae ${label} from CLI`)
    throw new HyphaeMemoirCliError(`Failed to load Hyphae ${label} from CLI`, 'unavailable', { cause: err })
  }
}

function compareMemoirsByUpdatedAtDesc(left: Memoir, right: Memoir): number {
  return right.updated_at.localeCompare(left.updated_at)
}

function compareConcepts(left: RawConcept, right: RawConcept): number {
  if (left.confidence !== right.confidence) return right.confidence - left.confidence
  return left.name.localeCompare(right.name)
}

function matchesMemoirFilter(concept: RawConcept, query?: string | null): boolean {
  const trimmed = query?.trim().toLowerCase()
  if (!trimmed) return true
  return concept.name.toLowerCase().includes(trimmed) || concept.definition.toLowerCase().includes(trimmed)
}

function toConcept(concept: RawConcept): Concept {
  return {
    community_id: concept.community_id ?? null,
    confidence: concept.confidence,
    created_at: concept.created_at,
    definition: concept.definition,
    id: concept.id,
    labels: JSON.stringify(concept.labels),
    memoir_id: concept.memoir_id,
    name: concept.name,
    revision: concept.revision,
    source_memory_ids: JSON.stringify(concept.source_memory_ids),
    updated_at: concept.updated_at,
  }
}

function toConceptLink(link: RawConceptLink): ConceptLink {
  return {
    created_at: link.created_at,
    id: link.id,
    relation: link.relation,
    source_id: link.source_id,
    target_id: link.target_id,
    weight: link.weight,
  }
}

function isMemoirListPayload(value: unknown): value is RawMemoirListPayload {
  const record = asRecord(value)
  return (
    !!record &&
    Array.isArray(record.memoirs) &&
    record.memoirs.every((entry) => {
      const item = asRecord(entry)
      return !!item && isRawMemoir(item.memoir) && typeof item.concept_count === 'number' && typeof item.link_count === 'number'
    })
  )
}

function isMemoirShowPayload(value: unknown): value is RawMemoirShowPayload {
  const record = asRecord(value)
  const stats = record ? asRecord(record.stats) : null
  return (
    !!record &&
    isRawMemoir(record.memoir) &&
    Array.isArray(record.concepts) &&
    record.concepts.every(isRawConcept) &&
    typeof record.limit === 'number' &&
    typeof record.offset === 'number' &&
    (record.query === null || record.query === undefined || typeof record.query === 'string') &&
    typeof record.total === 'number' &&
    !!stats &&
    typeof stats.total_concepts === 'number' &&
    typeof stats.total_links === 'number' &&
    typeof stats.avg_confidence === 'number' &&
    Array.isArray(stats.label_counts)
  )
}

function isMemoirSearchPayload(value: unknown): value is RawMemoirSearchPayload {
  const record = asRecord(value)
  return (
    !!record &&
    (record.memoir === null || record.memoir === undefined || isRawMemoir(record.memoir)) &&
    typeof record.query === 'string' &&
    typeof record.limit === 'number' &&
    typeof record.offset === 'number' &&
    typeof record.total === 'number' &&
    Array.isArray(record.results) &&
    record.results.every(isRawConcept)
  )
}

function isMemoirSearchAllPayload(value: unknown): value is RawMemoirSearchAllPayload {
  const record = asRecord(value)
  return (
    !!record &&
    typeof record.query === 'string' &&
    typeof record.limit === 'number' &&
    typeof record.offset === 'number' &&
    typeof record.total === 'number' &&
    Array.isArray(record.results) &&
    record.results.every((entry) => {
      const item = asRecord(entry)
      return !!item && isRawMemoir(item.memoir) && isRawConcept(item.concept)
    })
  )
}

function isMemoirInspectPayload(value: unknown): value is RawMemoirInspectPayload {
  const record = asRecord(value)
  const neighborhood = record ? asRecord(record.neighborhood) : null
  return (
    !!record &&
    isRawMemoir(record.memoir) &&
    isRawConcept(record.concept) &&
    typeof record.depth === 'number' &&
    !!neighborhood &&
    Array.isArray(neighborhood.concepts) &&
    neighborhood.concepts.every(isRawConcept) &&
    Array.isArray(neighborhood.links) &&
    neighborhood.links.every(isRawConceptLink)
  )
}

function rebuildNeighbors(payload: RawMemoirInspectPayload): ConceptInspection['neighbors'] {
  const conceptMap = new Map(payload.neighborhood.concepts.map((concept) => [concept.id, toConcept(concept)]))
  const links = payload.neighborhood.links.map(toConceptLink)
  const neighbors: ConceptInspection['neighbors'] = []
  const visited = new Set<string>([payload.concept.id])
  let frontier = [payload.concept.id]

  for (let depthIndex = 0; depthIndex < payload.depth && frontier.length > 0; depthIndex++) {
    const nextFrontier: string[] = []

    for (const nodeId of frontier) {
      for (const link of links) {
        if (link.source_id === nodeId && !visited.has(link.target_id)) {
          const concept = conceptMap.get(link.target_id)
          if (!concept) continue
          visited.add(link.target_id)
          nextFrontier.push(link.target_id)
          neighbors.push({ concept, direction: 'outgoing', link })
        }

        if (link.target_id === nodeId && !visited.has(link.source_id)) {
          const concept = conceptMap.get(link.source_id)
          if (!concept) continue
          visited.add(link.source_id)
          nextFrontier.push(link.source_id)
          neighbors.push({ concept, direction: 'incoming', link })
        }
      }
    }

    frontier = nextFrontier
  }

  return neighbors
}

async function loadMemoirShowPage(memoirName: string, offset: number, limit: number): Promise<RawMemoirShowPayload | null> {
  try {
    const stdout = await runMemoirCli(['show', memoirName, '--json', '--limit', String(limit), '--offset', String(offset)], 'memoir show')
    const payload = parseJson(stdout, isMemoirShowPayload, 'memoir show')
    if ((payload as { schema_version?: string }).schema_version !== MEMOIR_SHOW_SCHEMA_VERSION) {
      throw new HyphaeMemoirCliError('Hyphae memoir show returned an invalid payload', 'invalid_payload')
    }
    return payload
  } catch (err) {
    if (err instanceof HyphaeMemoirCliError && err.kind === 'unavailable' && memoirNotFound(err.cause)) {
      return null
    }
    throw err
  }
}

async function loadMemoirSearchPage(
  memoirName: string,
  query: string,
  offset: number,
  limit: number
): Promise<RawMemoirSearchPayload | null> {
  try {
    const stdout = await runMemoirCli(
      ['search', query, '--memoir', memoirName, '--limit', String(limit), '--offset', String(offset), '--json'],
      'memoir search'
    )
    const payload = parseJson(stdout, isMemoirSearchPayload, 'memoir search')
    if ((payload as { schema_version?: string }).schema_version !== MEMOIR_SEARCH_SCHEMA_VERSION) {
      throw new HyphaeMemoirCliError('Hyphae memoir search returned an invalid payload', 'invalid_payload')
    }
    return payload
  } catch (err) {
    if (err instanceof HyphaeMemoirCliError && err.kind === 'unavailable' && memoirNotFound(err.cause)) {
      return null
    }
    throw err
  }
}

async function loadSearchAllPage(query: string, offset: number, limit: number): Promise<RawMemoirSearchAllPayload> {
  const stdout = await runMemoirCli(
    ['search-all', query, '--limit', String(limit), '--offset', String(offset), '--json'],
    'memoir search-all'
  )
  const payload = parseJson(stdout, isMemoirSearchAllPayload, 'memoir search-all')
  if ((payload as { schema_version?: string }).schema_version !== MEMOIR_SEARCH_ALL_SCHEMA_VERSION) {
    throw new HyphaeMemoirCliError('Hyphae memoir search-all returned an invalid payload', 'invalid_payload')
  }
  return payload
}

export async function memoirList(): Promise<Memoir[]> {
  const stdout = await runMemoirCli(['list', '--json'], 'memoir list')
  const payload = parseJson(stdout, isMemoirListPayload, 'memoir list')
  if ((payload as { schema_version?: string }).schema_version !== MEMOIR_LIST_SCHEMA_VERSION) {
    throw new HyphaeMemoirCliError('Hyphae memoir list returned an invalid payload', 'invalid_payload')
  }
  return payload.memoirs.map((entry) => entry.memoir).sort(compareMemoirsByUpdatedAtDesc)
}

export async function memoirShow(name: string, options?: { limit?: number; offset?: number; q?: string }): Promise<MemoirDetail | null> {
  const firstPage = await loadMemoirShowPage(name, 0, MEMOIR_PAGE_SIZE)
  if (!firstPage) return null

  const allConcepts = [...firstPage.concepts]
  for (let offset = allConcepts.length; offset < firstPage.total; offset += MEMOIR_PAGE_SIZE) {
    const page = await loadMemoirShowPage(name, offset, MEMOIR_PAGE_SIZE)
    if (!page || page.concepts.length === 0) break
    allConcepts.push(...page.concepts)
  }

  const limit = options?.limit ?? 200
  const offset = options?.offset ?? 0
  const query = options?.q?.trim() ? options.q.trim() : null
  const filteredConcepts = allConcepts.filter((concept) => matchesMemoirFilter(concept, query)).sort(compareConcepts)

  return {
    concepts: filteredConcepts.slice(offset, offset + limit).map(toConcept),
    limit,
    memoir: firstPage.memoir,
    offset,
    query,
    total_concepts: filteredConcepts.length,
  }
}

export async function memoirSearch(memoirName: string, query: string): Promise<Concept[]> {
  const firstPage = await loadMemoirSearchPage(memoirName, query, 0, SEARCH_PAGE_SIZE)
  if (!firstPage) return []

  const results = [...firstPage.results]
  for (let offset = results.length; offset < firstPage.total; offset += SEARCH_PAGE_SIZE) {
    const page = await loadMemoirSearchPage(memoirName, query, offset, SEARCH_PAGE_SIZE)
    if (!page || page.results.length === 0) break
    results.push(...page.results)
  }

  return results.map(toConcept)
}

export async function memoirSearchAll(query: string): Promise<Concept[]> {
  const firstPage = await loadSearchAllPage(query, 0, SEARCH_PAGE_SIZE)
  const results = [...firstPage.results]

  for (let offset = results.length; offset < firstPage.total; offset += SEARCH_PAGE_SIZE) {
    const page = await loadSearchAllPage(query, offset, SEARCH_PAGE_SIZE)
    if (page.results.length === 0) break
    results.push(...page.results)
  }

  return results.map((entry) => toConcept(entry.concept))
}

export async function memoirInspect(memoirName: string, conceptName: string, depth = 2): Promise<ConceptInspection | null> {
  const args = ['inspect', memoirName, '--concept', conceptName, '--depth', String(depth), '--json']

  try {
    const stdout = await runMemoirCli(args, 'memoir inspect')
    const payload = parseJson(stdout, isMemoirInspectPayload, 'memoir inspect')
    if ((payload as { schema_version?: string }).schema_version !== MEMOIR_INSPECT_SCHEMA_VERSION) {
      throw new HyphaeMemoirCliError('Hyphae memoir inspect returned an invalid payload', 'invalid_payload')
    }
    return {
      concept: toConcept(payload.concept),
      neighbors: rebuildNeighbors(payload),
    }
  } catch (err) {
    if (err instanceof HyphaeMemoirCliError && err.kind === 'unavailable') {
      if (memoirNotFound(err.cause) || conceptNotFound(err.cause)) {
        return null
      }
    }
    throw err
  }
}
