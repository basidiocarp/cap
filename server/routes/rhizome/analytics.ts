import type { Hono } from 'hono'

import { cachedAsync } from '../../lib/cache.ts'
import { registry } from '../../lib/rhizome-registry.ts'
import { logger } from '../../logger.ts'

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

export function registerAnalyticsRoutes(app: Hono) {
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
}

export function registerStatusRoute(app: Hono) {
  app.get('/status', (c) => {
    return c.json({
      available: true,
      backend: 'tree-sitter',
      languages: ['rust', 'typescript', 'javascript', 'python', 'go', 'java', 'c', 'cpp', 'ruby'],
    })
  })
}
