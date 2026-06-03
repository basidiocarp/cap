import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { encodeProjectPath, parseMemoryIndex, readMemoryIndex } from '../memory-index.ts'

describe('parseMemoryIndex', () => {
  it('parses index entries with an em-dash hook', () => {
    const md = '- [RAG visual](rag.md) — investigate graph view'
    const { entries } = parseMemoryIndex(md, ['rag.md'])
    expect(entries).toEqual([{ file: 'rag.md', hook: 'investigate graph view', lineNumber: 1, title: 'RAG visual' }])
  })

  it('accepts em-dash, en-dash, and ascii-hyphen separators', () => {
    const md = ['- [A](a.md) — em', '- [B](b.md) – en', '- [C](c.md) - ascii'].join('\n')
    const { entries } = parseMemoryIndex(md, [])
    expect(entries.map((e) => e.hook)).toEqual(['em', 'en', 'ascii'])
  })

  it('parses entries with no hook', () => {
    const { entries } = parseMemoryIndex('- [Solo](solo.md)', [])
    expect(entries).toEqual([{ file: 'solo.md', hook: '', lineNumber: 1, title: 'Solo' }])
  })

  it('records 1-based line numbers and ignores non-entry lines', () => {
    const md = ['# Heading', '', '- [First](first.md) — one', 'prose line', '- [Second](second.md) — two'].join('\n')
    const { entries } = parseMemoryIndex(md, [])
    expect(entries.map((e) => [e.title, e.lineNumber])).toEqual([
      ['First', 3],
      ['Second', 5],
    ])
  })

  it('ignores links that are not .md files', () => {
    const md = ['- [Doc](doc.md) — kept', '- [Site](https://example.com) — dropped', '- [Img](pic.png) — dropped'].join('\n')
    const { entries } = parseMemoryIndex(md, [])
    expect(entries.map((e) => e.title)).toEqual(['Doc'])
  })

  it('ignores scheme-prefixed URLs that end in .md', () => {
    const md = '- [README](https://github.com/org/repo/README.md) — external'
    const { entries } = parseMemoryIndex(md, [])
    expect(entries).toEqual([])
  })

  it('flags .md files on disk that are not referenced as orphans, sorted', () => {
    const md = '- [Known](known.md) — referenced'
    const { orphanFiles } = parseMemoryIndex(md, ['known.md', 'zeta.md', 'alpha.md', 'notes.txt'])
    expect(orphanFiles).toEqual(['alpha.md', 'zeta.md'])
  })

  it('never treats MEMORY.md itself as an orphan', () => {
    const { orphanFiles } = parseMemoryIndex('', ['MEMORY.md', 'orphan.md'])
    expect(orphanFiles).toEqual(['orphan.md'])
  })

  it('never treats a case-variant of MEMORY.md as an orphan', () => {
    const { orphanFiles } = parseMemoryIndex('', ['memory.md', 'MEMORY.MD'])
    expect(orphanFiles).toEqual([])
  })

  it('returns rawMarkdown verbatim', () => {
    const md = '- [A](a.md) — x\n\nfooter'
    expect(parseMemoryIndex(md, []).rawMarkdown).toBe(md)
  })
})

describe('encodeProjectPath', () => {
  // Cases mirror spore/src/paths.rs::encode_project_path tests.
  it.each([
    ['/Users/williamnewton/projects/personal/basidiocarp', '-Users-williamnewton-projects-personal-basidiocarp'],
    ['/a.b_c\\d', '-a-b-c-d'],
    ['//a', '--a'],
    ['/a/./b', '-a---b'],
    ['café', 'caf-'],
    ['foo/ü', 'foo--'],
    ['', ''],
    ['-Users-foo-bar', '-Users-foo-bar'],
  ])('encodes %j as %j', (input, expected) => {
    expect(encodeProjectPath(input)).toBe(expected)
  })

  it('is idempotent on already-encoded segments', () => {
    const once = encodeProjectPath('/Users/williamnewton/projects')
    expect(encodeProjectPath(once)).toBe(once)
  })
})

describe('readMemoryIndex', () => {
  it('returns an empty index when the memory directory is absent', async () => {
    const root = mkdtempSync(join(tmpdir(), 'cap-memidx-'))
    try {
      const index = await readMemoryIndex(join(root, 'does-not-exist'))
      expect(index).toEqual({ entries: [], orphanFiles: [], rawMarkdown: '' })
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
  })

  it('treats every .md as an orphan when the dir exists but MEMORY.md is missing', async () => {
    // Point readMemoryIndex at a temp HOME so the encoded path resolves under it.
    const home = mkdtempSync(join(tmpdir(), 'cap-home-'))
    const realHome = process.env.HOME
    process.env.HOME = home
    try {
      const projectRoot = '/proj/sample'
      const memoryDir = join(home, '.claude', 'projects', encodeProjectPath(projectRoot), 'memory')
      mkdirSync(memoryDir, { recursive: true })
      writeFileSync(join(memoryDir, 'lone.md'), 'content', 'utf8')

      const index = await readMemoryIndex(projectRoot)
      expect(index.entries).toEqual([])
      expect(index.orphanFiles).toEqual(['lone.md'])
    } finally {
      if (realHome === undefined) {
        delete process.env.HOME
      } else {
        process.env.HOME = realHome
      }
      rmSync(home, { force: true, recursive: true })
    }
  })

  it('parses MEMORY.md and surfaces orphans from the same directory', async () => {
    const home = mkdtempSync(join(tmpdir(), 'cap-home-'))
    const realHome = process.env.HOME
    process.env.HOME = home
    try {
      const projectRoot = '/proj/sample'
      const memoryDir = join(home, '.claude', 'projects', encodeProjectPath(projectRoot), 'memory')
      mkdirSync(memoryDir, { recursive: true })
      writeFileSync(join(memoryDir, 'MEMORY.md'), '- [Known](known.md) — referenced', 'utf8')
      writeFileSync(join(memoryDir, 'known.md'), 'k', 'utf8')
      writeFileSync(join(memoryDir, 'stray.md'), 's', 'utf8')

      const index = await readMemoryIndex(projectRoot)
      expect(index.entries.map((e) => e.title)).toEqual(['Known'])
      expect(index.orphanFiles).toEqual(['stray.md'])
    } finally {
      if (realHome === undefined) {
        delete process.env.HOME
      } else {
        process.env.HOME = realHome
      }
      rmSync(home, { force: true, recursive: true })
    }
  })
})
