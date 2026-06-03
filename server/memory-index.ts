import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve, sep } from 'node:path'

export interface MemoryEntry {
  title: string
  file: string
  hook: string
  lineNumber: number
}

export interface MemoryIndex {
  rawMarkdown: string
  entries: MemoryEntry[]
  orphanFiles: string[]
}

// Matches a curated index line: `- [Title](file.md) — hook`.
// Separator accepts em-dash, en-dash, or ASCII hyphen; the hook is optional.
// The file group excludes `:` so scheme-prefixed URLs ending in `.md`
// (e.g. `https://host/README.md`) are not mistaken for local memory files.
// eslint-disable-next-line sonarjs/slow-regex -- bounded negated char classes, no backtracking
const ENTRY_REGEX = /^\s*-\s*\[([^\]\n]+)\]\(([^:)\n]+\.md)\)\s*(?:[—–-]\s*(.*))?$/

/**
 * Parse a MEMORY.md index plus the memory directory listing into entries and
 * orphan files. Pure: no I/O, linear in the input size. An orphan is a `.md`
 * file present on disk, not `MEMORY.md` itself, and not referenced by any entry.
 */
export function parseMemoryIndex(markdown: string, dirListing: readonly string[]): MemoryIndex {
  const entries: MemoryEntry[] = []
  const seenFiles = new Set<string>()
  const lines = markdown.split(/\r?\n/)

  lines.forEach((line, idx) => {
    const match = ENTRY_REGEX.exec(line)
    if (!match) {
      return
    }
    const [, title, file, hook] = match
    if (!title || !file) {
      return
    }
    entries.push({ file: file.trim(), hook: (hook ?? '').trim(), lineNumber: idx + 1, title: title.trim() })
    seenFiles.add(file.trim())
  })

  const orphanFiles = dirListing
    .filter((name) => name.toLowerCase().endsWith('.md'))
    .filter((name) => name.toLowerCase() !== 'memory.md' && !seenFiles.has(name))
    .sort((a, b) => a.localeCompare(b))

  return { entries, orphanFiles, rawMarkdown: markdown }
}

/**
 * Encode a project path into the segment Claude Code uses under
 * `~/.claude/projects/<encoded>/`. Faithful port of spore's
 * `encode_project_path` (spore/src/paths.rs): `/`, `.`, `_`, `\`, and any
 * non-ASCII scalar collapse to `-`; other ASCII characters are kept.
 *
 * Iterating by code point (`for...of`) matches Rust's `chars()`. Because every
 * path separator and `.` collapses to `-`, an encoded segment can never contain
 * a separator or `..`, so it cannot traverse out of `~/.claude/projects/`.
 */
export function encodeProjectPath(path: string): string {
  let encoded = ''
  for (const ch of path) {
    if (ch === '/' || ch === '.' || ch === '_' || ch === '\\') {
      encoded += '-'
      continue
    }
    // Non-ASCII: multi-unit code point, or a single unit >= 128.
    if (ch.length > 1 || (ch.codePointAt(0) ?? 0) > 127) {
      encoded += '-'
      continue
    }
    encoded += ch
  }
  return encoded
}

const ENOENT_CODES = new Set(['ENOENT', 'ENOTDIR'])

function isMissingPathError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && ENOENT_CODES.has((error as { code?: string }).code ?? '')
}

const EMPTY_INDEX: MemoryIndex = { entries: [], orphanFiles: [], rawMarkdown: '' }

/**
 * Read and parse the file-based auto-memory index for a project. Resolves the
 * memory directory from the project root (defaulting to RHIZOME_PROJECT or the
 * server cwd), reads its `MEMORY.md` and directory listing, and returns the
 * parsed index.
 *
 * Degraded, not broken: a missing memory directory or missing `MEMORY.md`
 * returns an empty index. Only unexpected filesystem errors propagate (the
 * route maps them to 502). The resolved directory is asserted to stay under
 * `~/.claude/projects/` as defence in depth on top of the encoding guarantee.
 */
export async function readMemoryIndex(projectRoot?: string): Promise<MemoryIndex> {
  const root = projectRoot ?? process.env.RHIZOME_PROJECT ?? process.cwd()
  const projectsRoot = join(homedir(), '.claude', 'projects')
  const memoryDir = resolve(projectsRoot, encodeProjectPath(root), 'memory')

  // Defence in depth: the encoding already removes separators, but confirm the
  // resolved path did not escape the projects root before touching disk.
  if (memoryDir !== projectsRoot && !memoryDir.startsWith(`${projectsRoot}${sep}`)) {
    return EMPTY_INDEX
  }

  let dirListing: string[]
  try {
    dirListing = await readdir(memoryDir)
  } catch (error) {
    if (isMissingPathError(error)) {
      return EMPTY_INDEX
    }
    throw error
  }

  let markdown = ''
  try {
    markdown = await readFile(join(memoryDir, 'MEMORY.md'), 'utf8')
  } catch (error) {
    if (!isMissingPathError(error)) {
      throw error
    }
    // MEMORY.md absent but the dir exists: every .md becomes an orphan.
  }

  return parseMemoryIndex(markdown, dirListing)
}
