import type { Stats } from 'node:fs'
import type { Context } from 'hono'
import { execFile } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { promisify } from 'node:util'
import { Hono } from 'hono'

import { cachedAsync } from '../lib/cache.ts'
import { RHIZOME_PROJECT } from '../lib/config.ts'
import { buildFileTree } from '../lib/fileTree.ts'
import { parseNumberParam, requireQuery } from '../lib/params.ts'
import { registry } from '../lib/rhizome-registry.ts'
import { logger } from '../logger.ts'

const exec = promisify(execFile)

const app = new Hono()

async function rhizomeTool(c: Context, tool: string, args: Record<string, unknown>): Promise<Response> {
  try {
    const result = await registry.getActive().callTool(tool, args)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, `Rhizome ${tool} failed`)
    return c.json({ error: message }, 500)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint factory
// ─────────────────────────────────────────────────────────────────────────────

const NUMERIC_PARAMS = new Set(['line', 'column', 'depth'])

function endpoint(tool: string, required: string[], optional: string[] = []) {
  return async (c: Context) => {
    const params: Record<string, unknown> = {}
    for (const key of required) {
      const val = requireQuery(c, key)
      if (val instanceof Response) return val
      params[key] = NUMERIC_PARAMS.has(key) ? Number(val) : val
    }
    for (const key of optional) {
      const val = c.req.query(key)
      if (val) params[key] = NUMERIC_PARAMS.has(key) ? Number(val) : val
    }
    return rhizomeTool(c, tool, params)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint factory — with numeric validation
// ─────────────────────────────────────────────────────────────────────────────

function numericEndpoint(tool: string, requiredStr: string[], requiredNum: string[]) {
  return async (c: Context) => {
    const params: Record<string, unknown> = {}
    for (const key of requiredStr) {
      const val = requireQuery(c, key)
      if (val instanceof Response) return val
      params[key] = val
    }
    for (const key of requiredNum) {
      const raw = requireQuery(c, key)
      if (raw instanceof Response) return raw
      const num = parseNumberParam(raw as string)
      if (num === undefined) {
        return c.json({ error: `${key} must be a valid number` }, 400)
      }
      params[key] = num
    }
    return rhizomeTool(c, tool, params)
  }
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
  if (!registry.getActive().isAvailable()) return UNAVAILABLE_RESPONSE

  return {
    available: true,
    backend_usage: { lsp: false, treesitter: true },
    languages: SUPPORTED_LANGUAGES.map((language) => ({ detection: 'tree-sitter', language })),
    supported_tools: [...SUPPORTED_TOOLS],
    tool_calls: [],
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
  if (!registry.getActive().isAvailable()) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Simple endpoints (factory-based)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/symbols', endpoint('get_symbols', ['file']))
app.get('/definition', endpoint('get_definition', ['file', 'symbol']))
app.get('/structure', endpoint('get_structure', ['file'], ['depth']))
app.get('/annotations', endpoint('get_annotations', ['file']))
app.get('/complexity', endpoint('get_complexity', ['file']))
app.get('/dependencies', endpoint('get_dependencies', ['file']))
app.get('/tests', endpoint('get_tests', ['file']))
app.get('/exports', endpoint('get_exports', ['file']))
app.get('/summary', endpoint('summarize_file', ['file']))
app.get('/type-definitions', endpoint('get_type_definitions', ['file']))
app.get('/parameters', endpoint('get_parameters', ['file', 'symbol']))

// ─────────────────────────────────────────────────────────────────────────────
// Numeric-validated endpoints
// ─────────────────────────────────────────────────────────────────────────────

app.get('/references', numericEndpoint('find_references', ['file'], ['line', 'column']))
app.get('/hover', numericEndpoint('get_hover_info', ['file'], ['line', 'column']))
app.get('/scope', numericEndpoint('get_scope', ['file'], ['line']))
app.get('/enclosing-class', numericEndpoint('get_enclosing_class', ['file'], ['line']))

// ─────────────────────────────────────────────────────────────────────────────
// Custom endpoints (unique logic)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/search', async (c) => {
  const pattern = requireQuery(c, 'pattern')
  if (pattern instanceof Response) return pattern
  const args: Record<string, unknown> = { pattern }
  const searchPath = c.req.query('path')
  if (searchPath) args.path = searchPath
  return rhizomeTool(c, 'search_symbols', args)
})

app.get('/diagnostics', async (c) => {
  const file = c.req.query('file')
  if (!file) return c.json([])
  return rhizomeTool(c, 'get_diagnostics', { file })
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

app.get('/call-sites', async (c) => {
  const file = requireQuery(c, 'file')
  if (file instanceof Response) return file
  const args: Record<string, unknown> = { file }
  const fn = c.req.query('function')
  if (fn) args.function = fn
  return rhizomeTool(c, 'get_call_sites', args)
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

// ─────────────────────────────────────────────────────────────────────────────
// Project switching
// ─────────────────────────────────────────────────────────────────────────────

app.get('/project', (c) => {
  return c.json({
    active: registry.getActiveProject(),
    recent: registry.getRecentProjects(),
  })
})

app.post('/project', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const path = body.path
  if (!path || typeof path !== 'string') {
    return c.json({ error: 'Missing required field: path' }, 400)
  }
  // Validate path exists
  if (!existsSync(path)) {
    return c.json({ error: `Path does not exist: ${path}` }, 400)
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Validate path is a directory
  // ─────────────────────────────────────────────────────────────────────────────
  let stat: Stats
  try {
    stat = statSync(path)
  } catch {
    return c.json({ error: `Cannot access path: ${path}` }, 400)
  }
  if (!stat.isDirectory()) {
    return c.json({ error: `Path is not a directory: ${path}` }, 400)
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Warn if no project marker found (but don't block)
  // ─────────────────────────────────────────────────────────────────────────────
  const projectMarkers = ['.git', 'package.json', 'Cargo.toml', 'pyproject.toml', 'go.mod']
  const hasMarker = projectMarkers.some((marker) => existsSync(`${path}/${marker}`))
  if (!hasMarker) {
    logger.warn({ path }, 'Switched to directory without recognized project marker')
  }
  registry.switchProject(path)
  return c.json({
    active: registry.getActiveProject(),
    recent: registry.getRecentProjects(),
  })
})

export default app
