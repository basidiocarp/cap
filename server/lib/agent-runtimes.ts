import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import type { AgentRuntimeStatus, CodexNotifyStatus } from '../../src/lib/types/status.ts'

const CODEX_NOTIFY_CONTRACT = ['hyphae', 'codex-notify'] as const

function parseTomlStringArray(content: string, key: string): string[] | null {
  const match = content.match(new RegExp(`^\\s*${key}\\s*=\\s*\\[([\\s\\S]*?)\\]`, 'm'))
  if (!match) return null

  const values = Array.from(match[1].matchAll(/"((?:\\.|[^"])*)"/g), (entry) => entry[1])
  return values
}

export function loadCodexNotifyStatus(configPath: string): CodexNotifyStatus {
  if (!existsSync(configPath)) {
    return {
      command: null,
      config_path: null,
      configured: false,
      contract_matched: false,
    }
  }

  try {
    const content = readFileSync(configPath, 'utf-8')
    const values = parseTomlStringArray(content, 'notify')

    if (!values) {
      return {
        command: null,
        config_path: configPath,
        configured: false,
        contract_matched: false,
      }
    }

    const command = values.length > 0 ? values.join(' ') : null
    const contractMatched =
      values.length === CODEX_NOTIFY_CONTRACT.length && values.every((value, index) => value === CODEX_NOTIFY_CONTRACT[index])

    return {
      command,
      config_path: configPath,
      configured: true,
      contract_matched: contractMatched,
    }
  } catch {
    return {
      command: null,
      config_path: configPath,
      configured: false,
      contract_matched: false,
    }
  }
}

export function detectAgentRuntimes(): {
  claude_code: AgentRuntimeStatus
  codex: AgentRuntimeStatus
} {
  const claudeConfigPath = join(homedir(), '.claude', 'settings.json')
  const codexConfigPath = join(homedir(), '.codex', 'config.toml')

  const claudeConfigured = existsSync(claudeConfigPath)
  const codexConfigured = existsSync(codexConfigPath)

  return {
    claude_code: {
      config_path: claudeConfigured ? claudeConfigPath : null,
      configured: claudeConfigured,
      detected: existsSync(join(homedir(), '.claude')),
      integration: 'hooks',
    },
    codex: {
      config_path: codexConfigured ? codexConfigPath : null,
      configured: codexConfigured,
      detected: existsSync(join(homedir(), '.codex')),
      integration: 'mcp',
      notify: loadCodexNotifyStatus(codexConfigPath),
    },
  }
}
