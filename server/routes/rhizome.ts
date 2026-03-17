import type { Context } from 'hono'
import { execFile } from 'node:child_process'
import { extname } from 'node:path'
import { promisify } from 'node:util'
import { Hono } from 'hono'

import { cachedAsync } from '../lib/cache.ts'
import { RHIZOME_PROJECT } from '../lib/config.ts'
import { parseNumberParam, requireQuery } from '../lib/params.ts'
import { logger } from '../logger.ts'
import { rhizome } from '../rhizome.ts'

const exec = promisify(execFile)

const app = new Hono()

async function rhizomeTool(c: Context, tool: string, args: Record<string, unknown>): Promise<Response> {
  try {
    const result = await rhizome.callTool(tool, args)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, `Rhizome ${tool} failed`)
    return c.json({ error: message }, 500)
  }
}

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

const SUPPORTED_TOOLS = [
  'find_references',
  'get_annotations',
  'get_call_sites',
  'get_complexity',
  'get_definition',
  'get_dependencies',
  'get_diagnostics',
  'get_doc_comments',
  'get_enclosing_class',
  'get_exports',
  'get_file_outline',
  'get_hover_info',
  'get_implementations',
  'get_parameters',
  'get_project_structure',
  'get_scope',
  'get_signature',
  'get_symbol_body',
  'get_symbols',
  'get_structure',
  'get_tests',
  'get_type_definitions',
  'go_to_definition',
  'rename_symbol',
  'search_symbols',
  'summarize_file',
] as const

const SUPPORTED_LANGUAGES = [
  'bash',
  'c',
  'cpp',
  'csharp',
  'css',
  'dart',
  'elixir',
  'go',
  'haskell',
  'html',
  'java',
  'javascript',
  'json',
  'julia',
  'kotlin',
  'lua',
  'markdown',
  'objective-c',
  'ocaml',
  'perl',
  'php',
  'python',
  'r',
  'ruby',
  'rust',
  'scala',
  'swift',
  'terraform',
  'toml',
  'typescript',
  'yaml',
  'zig',
] as const

const UNAVAILABLE_RESPONSE = {
  available: false,
  backend_usage: { lsp: false, treesitter: false },
  languages: [],
  supported_tools: [],
  tool_calls: [],
}

const getAnalytics = cachedAsync(async () => {
  if (!rhizome.isAvailable()) return UNAVAILABLE_RESPONSE

  return {
    available: true,
    backend_usage: { lsp: false, treesitter: true },
    languages: SUPPORTED_LANGUAGES.map((language) => ({ detection: 'tree-sitter', language })),
    supported_tools: [...SUPPORTED_TOOLS],
    tool_calls: SUPPORTED_TOOLS.map((tool) => ({ avg_duration_ms: 0, count: 0, tool })),
  }
}, 60_000)

// Analytics skips availability middleware so it returns data even when Rhizome is down
app.get('/analytics', async (c) => {
  try {
    const data = await getAnalytics()
    return c.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'Rhizome analytics failed')
    return c.json({ error: message }, 500)
  }
})

// Everything below requires Rhizome to be running
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
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  return rhizomeTool(c, 'get_symbols', { file })
})

app.get('/structure', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const args: Record<string, unknown> = { file }
  const depth = parseNumberParam(c.req.query('depth'))
  if (depth !== undefined) args.depth = depth
  return rhizomeTool(c, 'get_structure', args)
})

app.get('/definition', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const symbol = requireQuery(c, 'symbol')
  if (symbol instanceof Response) return symbol
  return rhizomeTool(c, 'get_definition', { file, symbol })
})

app.get('/search', async (c) => {
  const pattern = requireQuery(c, 'pattern')
  if (pattern instanceof Response) return pattern
  const args: Record<string, unknown> = { pattern }
  const searchPath = c.req.query('path')
  if (searchPath) args.path = searchPath
  return rhizomeTool(c, 'search_symbols', args)
})

app.get('/references', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const line = requireQuery(c, 'line')
  if (line instanceof Response) return line
  const column = requireQuery(c, 'column')
  if (column instanceof Response) return column
  const lineNum = parseNumberParam(line)
  const colNum = parseNumberParam(column)
  if (lineNum === undefined || colNum === undefined) {
    return c.json({ error: 'line and column must be valid numbers' }, 400)
  }
  return rhizomeTool(c, 'find_references', { column: colNum, file, line: lineNum })
})

app.get('/diagnostics', async (c) => {
  const file = c.req.query('file')
  if (!file) return c.json([])
  return rhizomeTool(c, 'get_diagnostics', { file })
})

app.get('/hover', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const line = requireQuery(c, 'line')
  if (line instanceof Response) return line
  const column = requireQuery(c, 'column')
  if (column instanceof Response) return column
  const lineNum = parseNumberParam(line)
  const colNum = parseNumberParam(column)
  if (lineNum === undefined || colNum === undefined) {
    return c.json({ error: 'line and column must be valid numbers' }, 400)
  }
  return rhizomeTool(c, 'get_hover_info', { column: colNum, file, line: lineNum })
})

app.get('/annotations', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  return rhizomeTool(c, 'get_annotations', { file })
})

app.get('/complexity', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  return rhizomeTool(c, 'get_complexity', { file })
})

app.get('/dependencies', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  return rhizomeTool(c, 'get_dependencies', { file })
})

app.get('/tests', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  return rhizomeTool(c, 'get_tests', { file })
})

app.get('/files', async (c) => {
  try {
    const basePath = c.req.query('path')
    const depthParam = parseNumberParam(c.req.query('depth'))
    const depth = depthParam ?? 2

    const { stdout } = await exec('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
      cwd: RHIZOME_PROJECT,
      timeout: 5000,
    })

    const files = stdout.trim().split('\n').filter(Boolean)
    const tree = buildFileTree(files, basePath, depth)
    return c.json(tree)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, 'File listing failed')
    return c.json({ error: message }, 500)
  }
})

app.get('/scope', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const line = requireQuery(c, 'line')
  if (line instanceof Response) return line
  const lineNum = parseNumberParam(line)
  if (lineNum === undefined) {
    return c.json({ error: 'line must be a valid number' }, 400)
  }
  return rhizomeTool(c, 'get_scope', { file, line: lineNum })
})

app.get('/exports', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  return rhizomeTool(c, 'get_exports', { file })
})

app.get('/call-sites', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const args: Record<string, unknown> = { file }
  const fn = c.req.query('function')
  if (fn) args.function = fn
  return rhizomeTool(c, 'get_call_sites', args)
})

app.get('/summary', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  return rhizomeTool(c, 'summarize_file', { file })
})

app.get('/symbol-body', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const symbol = requireQuery(c, 'symbol')
  if (symbol instanceof Response) return symbol
  const args: Record<string, unknown> = { file, symbol }
  const line = parseNumberParam(c.req.query('line'))
  if (line !== undefined) args.line = line
  return rhizomeTool(c, 'get_symbol_body', args)
})

app.get('/type-definitions', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  return rhizomeTool(c, 'get_type_definitions', { file })
})

app.get('/enclosing-class', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const line = requireQuery(c, 'line')
  if (line instanceof Response) return line
  const lineNum = parseNumberParam(line)
  if (lineNum === undefined) {
    return c.json({ error: 'line must be a valid number' }, 400)
  }
  return rhizomeTool(c, 'get_enclosing_class', { file, line: lineNum })
})

app.get('/parameters', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const symbol = requireQuery(c, 'symbol')
  if (symbol instanceof Response) return symbol
  return rhizomeTool(c, 'get_parameters', { file, symbol })
})

export default app
