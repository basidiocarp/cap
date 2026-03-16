import { execSync } from 'node:child_process'
import { extname } from 'node:path'
import { Hono } from 'hono'

import { logger } from '../logger.ts'
import { rhizome } from '../rhizome.ts'

const app = new Hono()

const PROJECT_DIR = process.env.RHIZOME_PROJECT ?? process.cwd()

const EXT_LANGUAGE: Record<string, string> = {
  '.c': 'c',
  '.cc': 'cpp',
  '.cpp': 'cpp',
  '.css': 'css',
  '.cxx': 'cpp',
  '.go': 'go',
  '.h': 'c',
  '.hpp': 'cpp',
  '.html': 'html',
  '.java': 'java',
  '.js': 'javascript',
  '.json': 'json',
  '.jsx': 'javascript',
  '.md': 'markdown',
  '.mts': 'typescript',
  '.py': 'python',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.toml': 'toml',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.yaml': 'yaml',
  '.yml': 'yaml',
}

interface FileNode {
  children?: FileNode[]
  language?: string
  name: string
  path: string
  type: 'dir' | 'file'
}

function inferLanguage(filename: string): string | undefined {
  return EXT_LANGUAGE[extname(filename)]
}

function buildFileTree(files: string[], basePath: string | undefined, maxDepth: number): FileNode[] {
  const rootChildren: FileNode[] = []
  const prefix = basePath ? (basePath.endsWith('/') ? basePath : `${basePath}/`) : ''

  for (const filePath of files) {
    if (prefix && !filePath.startsWith(prefix)) continue

    const relPath = prefix ? filePath.slice(prefix.length) : filePath
    if (!relPath) continue

    const parts = relPath.split('/')
    let currentChildren = rootChildren

    for (let i = 0; i < parts.length; i++) {
      if (i >= maxDepth) break

      const part = parts[i]
      const fullPath = prefix ? `${prefix}${parts.slice(0, i + 1).join('/')}` : parts.slice(0, i + 1).join('/')
      const isFile = i === parts.length - 1

      if (isFile) {
        const node: FileNode = { name: part, path: fullPath, type: 'file' }
        const lang = inferLanguage(part)
        if (lang) node.language = lang
        currentChildren.push(node)
      } else {
        let dirNode = currentChildren.find((n) => n.name === part && n.type === 'dir')
        if (!dirNode) {
          dirNode = { children: [], name: part, path: fullPath, type: 'dir' }
          currentChildren.push(dirNode)
        }
        currentChildren = dirNode.children ?? []
      }
    }
  }

  return rootChildren
}

// All endpoints require Rhizome availability
app.use('*', async (c, next) => {
  if (!rhizome.isAvailable()) {
    return c.json({ available: false, error: 'Rhizome not installed' }, 503)
  }
  await next()
})

app.get('/status', (c) => {
  return c.json({
    available: true,
    backend: 'tree-sitter',
    languages: ['rust', 'typescript', 'javascript', 'python', 'go', 'java', 'c', 'cpp', 'ruby'],
  })
})

app.get('/symbols', async (c) => {
  const file = c.req.query('file')
  if (!file) return c.json({ error: 'Missing required parameter: file' }, 400)

  try {
    const result = await rhizome.callTool('get_symbols', { file })
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'Rhizome get_symbols failed')
    return c.json({ error: message }, 500)
  }
})

app.get('/structure', async (c) => {
  const file = c.req.query('file')
  if (!file) return c.json({ error: 'Missing required parameter: file' }, 400)

  try {
    const args: Record<string, unknown> = { file }
    const depth = c.req.query('depth')
    if (depth) args.depth = Number(depth)
    const result = await rhizome.callTool('get_structure', args)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'Rhizome get_structure failed')
    return c.json({ error: message }, 500)
  }
})

app.get('/definition', async (c) => {
  const file = c.req.query('file')
  const symbol = c.req.query('symbol')
  if (!file) return c.json({ error: 'Missing required parameter: file' }, 400)
  if (!symbol) return c.json({ error: 'Missing required parameter: symbol' }, 400)

  try {
    const result = await rhizome.callTool('get_definition', { file, symbol })
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'Rhizome get_definition failed')
    return c.json({ error: message }, 500)
  }
})

app.get('/search', async (c) => {
  const pattern = c.req.query('pattern')
  if (!pattern) return c.json({ error: 'Missing required parameter: pattern' }, 400)

  try {
    const args: Record<string, unknown> = { pattern }
    const searchPath = c.req.query('path')
    if (searchPath) args.path = searchPath
    const result = await rhizome.callTool('search_symbols', args)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'Rhizome search_symbols failed')
    return c.json({ error: message }, 500)
  }
})

app.get('/references', async (c) => {
  const file = c.req.query('file')
  const line = c.req.query('line')
  const column = c.req.query('column')
  if (!file) return c.json({ error: 'Missing required parameter: file' }, 400)
  if (!line) return c.json({ error: 'Missing required parameter: line' }, 400)
  if (!column) return c.json({ error: 'Missing required parameter: column' }, 400)

  try {
    const result = await rhizome.callTool('find_references', {
      column: Number(column),
      file,
      line: Number(line),
    })
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'Rhizome find_references failed')
    return c.json({ error: message }, 500)
  }
})

app.get('/diagnostics', async (c) => {
  const file = c.req.query('file')
  if (!file) return c.json([])

  try {
    const result = await rhizome.callTool('get_diagnostics', { file })
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'Rhizome get_diagnostics failed')
    return c.json({ error: message }, 500)
  }
})

app.get('/hover', async (c) => {
  const file = c.req.query('file')
  const line = c.req.query('line')
  const column = c.req.query('column')
  if (!file) return c.json({ error: 'Missing required parameter: file' }, 400)
  if (!line) return c.json({ error: 'Missing required parameter: line' }, 400)
  if (!column) return c.json({ error: 'Missing required parameter: column' }, 400)

  try {
    const result = await rhizome.callTool('get_hover_info', {
      column: Number(column),
      file,
      line: Number(line),
    })
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'Rhizome get_hover_info failed')
    return c.json({ error: message }, 500)
  }
})

app.get('/files', (c) => {
  try {
    const basePath = c.req.query('path')
    const depth = Number(c.req.query('depth') ?? '2')

    const output = execSync('git ls-files --cached --others --exclude-standard', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
    })

    const files = output.trim().split('\n').filter(Boolean)
    const tree = buildFileTree(files, basePath, depth)
    return c.json(tree)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'File listing failed')
    return c.json({ error: message }, 500)
  }
})

export default app
