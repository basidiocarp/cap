import type { Hono } from 'hono'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { RHIZOME_PROJECT } from '../../lib/config.ts'
import { buildFileTree } from '../../lib/fileTree.ts'
import { parseNumberParam, requireQuery } from '../../lib/params.ts'
import { logger } from '../../logger.ts'
import { endpoint, numericEndpoint, rhizomeTool } from './shared.ts'

const exec = promisify(execFile)

export function registerReadRoutes(app: Hono) {
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

  app.get('/references', numericEndpoint('find_references', ['file'], ['line', 'column']))
  app.get('/hover', numericEndpoint('get_hover_info', ['file'], ['line', 'column']))
  app.get('/scope', numericEndpoint('get_scope', ['file'], ['line']))
  app.get('/enclosing-class', numericEndpoint('get_enclosing_class', ['file'], ['line']))

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
}
