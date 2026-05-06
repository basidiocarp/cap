export type DiffLineType = 'add' | 'remove' | 'context'

export interface DiffLine {
  type: DiffLineType
  content: string
  oldLineNo: number | null
  newLineNo: number | null
}

export interface DiffHunk {
  header: string
  oldStart: number
  newStart: number
  lines: DiffLine[]
}

export interface ParsedDiff {
  filePath: string
  hunks: DiffHunk[]
}

const HUNK_HEADER_RE = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/

// Extracts the target file path from a diff header line like "+++ b/src/foo.ts".
function parseFilePath(lines: string[]): string {
  for (const line of lines) {
    if (line.startsWith('+++ b/')) return line.slice(6)
    if (line.startsWith('+++ ')) return line.slice(4)
  }
  return 'unknown'
}

export function parseDiff(text: string): ParsedDiff[] {
  if (!text.trim()) return []

  const allLines = text.split('\n')
  const results: ParsedDiff[] = []

  let i = 0

  while (i < allLines.length) {
    // Scan forward to the start of a new file diff.
    if (!allLines[i].startsWith('diff ')) {
      i++
      continue
    }

    // Collect header lines until the first hunk.
    const headerLines: string[] = []
    while (i < allLines.length && !allLines[i].startsWith('@@ ')) {
      headerLines.push(allLines[i])
      i++
    }

    const filePath = parseFilePath(headerLines)
    const hunks: DiffHunk[] = []

    while (i < allLines.length && !allLines[i].startsWith('diff ')) {
      const hunkLine = allLines[i]
      const match = hunkLine.match(HUNK_HEADER_RE)
      if (!match) {
        i++
        continue
      }

      const oldStart = parseInt(match[1], 10)
      const newStart = parseInt(match[2], 10)
      const lines: DiffLine[] = []
      let oldLineNo = oldStart
      let newLineNo = newStart
      i++

      while (i < allLines.length && !allLines[i].startsWith('@@ ') && !allLines[i].startsWith('diff ')) {
        const raw = allLines[i]
        if (raw.startsWith('+')) {
          lines.push({ content: raw.slice(1), newLineNo: newLineNo++, oldLineNo: null, type: 'add' })
        } else if (raw.startsWith('-')) {
          lines.push({ content: raw.slice(1), newLineNo: null, oldLineNo: oldLineNo++, type: 'remove' })
        } else if (raw.startsWith(' ') || raw === '') {
          lines.push({ content: raw.slice(1), newLineNo: newLineNo++, oldLineNo: oldLineNo++, type: 'context' })
        }
        i++
      }

      hunks.push({ header: hunkLine, lines, newStart, oldStart })
    }

    if (hunks.length > 0) {
      results.push({ filePath, hunks })
    }
  }

  return results
}

// Stable hash of a set of line contents — used as the annotation anchor.
export function hashLines(lines: string[]): string {
  let hash = 0
  const str = lines.join('\n')
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}
