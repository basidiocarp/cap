import { existsSync, readFileSync, statSync } from 'node:fs'

import { appConfigPath, appDataPath } from '../../lib/platform.ts'

function readToml(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null
    return readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

function tomlBool(content: string, key: string, fallback: boolean): boolean {
  const match = content.match(new RegExp(`^\\s*${key}\\s*=\\s*(true|false)`, 'm'))
  return match ? match[1] === 'true' : fallback
}

function tomlArrayLength(content: string, key: string): number {
  const match = content.match(new RegExp(`^\\s*${key}\\s*=\\s*\\[([^\\]]*)\\]`, 'm'))
  if (!match) return 0
  const items = match[1].trim()
  if (items.length === 0) return 0
  return items.split(',').filter((s) => s.trim().length > 0).length
}

function sectionEnabled(content: string, section: string): boolean {
  const regex = new RegExp(`\\[${section.replace('.', '\\.')}\\][\\s\\S]*?enabled\\s*=\\s*(true|false)`)
  const match = content.match(regex)
  if (match) return match[1] === 'true'
  return content.includes(`[${section}]`)
}

export function readRawToml(filePath: string): string | null {
  return readToml(filePath)
}

export function getHyphaeSettings(): {
  config_path: string | null
  config_present: boolean
  config_source: 'config_file' | 'platform_default'
  db_path: string
  db_source: 'env_override' | 'platform_default'
  db_size_bytes: number
  resolved_config_path: string
} {
  const configPath = appConfigPath('hyphae')
  const defaultDb = appDataPath('hyphae', 'hyphae.db')
  const dbPath = process.env.HYPHAE_DB ?? defaultDb
  const dbSource = process.env.HYPHAE_DB ? 'env_override' : 'platform_default'

  let configExists = false
  try {
    configExists = existsSync(configPath)
  } catch {
    // ignore
  }

  let dbSizeBytes = 0
  try {
    dbSizeBytes = statSync(dbPath).size
  } catch {
    // DB file may not exist
  }

  return {
    config_path: configExists ? configPath : null,
    config_present: configExists,
    config_source: configExists ? 'config_file' : 'platform_default',
    db_path: dbPath,
    db_size_bytes: dbSizeBytes,
    db_source: dbSource,
    resolved_config_path: configPath,
  }
}

export function getMyceliumSettings(): {
  config_path: string | null
  config_present: boolean
  config_source: 'config_file' | 'platform_default'
  filters: {
    hyphae: { enabled: boolean }
    rhizome: { enabled: boolean }
  }
  resolved_config_path: string
} {
  const configPath = appConfigPath('mycelium')
  const content = readToml(configPath)

  if (!content) {
    return {
      config_path: null,
      config_present: false,
      config_source: 'platform_default',
      filters: {
        hyphae: { enabled: false },
        rhizome: { enabled: false },
      },
      resolved_config_path: configPath,
    }
  }

  return {
    config_path: configPath,
    config_present: true,
    config_source: 'config_file',
    filters: {
      hyphae: { enabled: sectionEnabled(content, 'filters.hyphae') },
      rhizome: { enabled: sectionEnabled(content, 'filters.rhizome') },
    },
    resolved_config_path: configPath,
  }
}

export function getRhizomeSettings(): {
  auto_export: boolean
  config_path: string | null
  config_present: boolean
  config_source: 'config_file' | 'platform_default'
  languages_enabled: number
  resolved_config_path: string
} {
  const configPath = appConfigPath('rhizome')
  const content = readToml(configPath)

  if (!content) {
    return {
      auto_export: false,
      config_path: null,
      config_present: false,
      config_source: 'platform_default',
      languages_enabled: 32,
      resolved_config_path: configPath,
    }
  }

  const explicitLanguages = tomlArrayLength(content, 'languages')
  return {
    auto_export: tomlBool(content, 'auto_export', false),
    config_path: configPath,
    config_present: true,
    config_source: 'config_file',
    languages_enabled: explicitLanguages > 0 ? explicitLanguages : 32,
    resolved_config_path: configPath,
  }
}
