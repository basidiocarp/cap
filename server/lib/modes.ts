import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface Mode {
  description: string
  hyphae_tools: string[]
  rhizome_tools: string[]
}

export interface ModeConfig {
  active: string
  modes: Record<string, Mode>
}

const CONFIG_DIR = join(homedir(), '.config', 'basidiocarp')
const CONFIG_PATH = join(CONFIG_DIR, 'modes.json')

const DEFAULT_CONFIG: ModeConfig = {
  active: 'develop',
  modes: {
    develop: {
      description: 'Full access including editing — all tools available',
      hyphae_tools: ['*'],
      rhizome_tools: ['*'],
    },
    explore: {
      description: 'Read-only analysis — no file modifications',
      hyphae_tools: ['recall', 'search', 'stats', 'health', 'memoir_show', 'memoir_search', 'gather_context', 'session_context'],
      rhizome_tools: [
        'get_symbols',
        'get_structure',
        'get_definition',
        'search_symbols',
        'find_references',
        'get_diagnostics',
        'get_hover_info',
        'get_annotations',
        'get_complexity',
        'get_dependencies',
        'get_tests',
        'get_scope',
        'get_exports',
        'get_call_sites',
        'summarize_file',
        'summarize_project',
      ],
    },
    review: {
      description: 'Code review focused — symbols, complexity, annotations, diagnostics',
      hyphae_tools: ['recall', 'search', 'gather_context'],
      rhizome_tools: [
        'get_symbols',
        'get_complexity',
        'get_annotations',
        'get_diagnostics',
        'get_diff_symbols',
        'get_changed_files',
        'find_references',
        'get_structure',
      ],
    },
  },
}

export function loadModes(): ModeConfig {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf-8')
      return JSON.parse(raw) as ModeConfig
    }
  } catch {
    // Fall through to defaults
  }
  return { ...DEFAULT_CONFIG }
}

export function saveModes(config: ModeConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

export function activateMode(name: string): ModeConfig {
  const config = loadModes()
  if (!config.modes[name]) {
    throw new Error(`Unknown mode: ${name}. Available: ${Object.keys(config.modes).join(', ')}`)
  }
  const updated = { ...config, active: name }
  saveModes(updated)
  return updated
}
