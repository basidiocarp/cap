import { existsSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

import type { AgentAdapterStatus, AgentRuntimeStatus, CodexNotifyStatus } from '../../src/lib/types/status.ts'
import { claudeSettingsPath, codexConfigPath } from './platform.ts'

const CODEX_NOTIFY_CONTRACT = ['hyphae', 'codex-notify'] as const

function buildAdapterStatus(kind: AgentAdapterStatus['kind'], label: string, configured: boolean, detected: boolean): AgentAdapterStatus {
  return { configured, detected, kind, label }
}

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
  const claudeConfig = claudeSettingsPath()
  const codexConfig = codexConfigPath()

  const claudeConfigured = existsSync(claudeConfig)
  const codexConfigured = existsSync(codexConfig)

  return {
    claude_code: {
      adapter: buildAdapterStatus('hooks', 'Claude lifecycle hooks', claudeConfigured, existsSync(dirname(claudeConfig))),
      config_path: claudeConfigured ? claudeConfig : null,
      configured: claudeConfigured,
      detected: existsSync(dirname(claudeConfig)),
      integration: 'hooks',
      resolved_config_path: claudeConfig,
      resolved_config_source: claudeConfigured ? 'config_file' : 'platform_default',
    },
    codex: {
      adapter: buildAdapterStatus('mcp', 'Codex MCP', codexConfigured, existsSync(dirname(codexConfig))),
      config_path: codexConfigured ? codexConfig : null,
      configured: codexConfigured,
      detected: existsSync(dirname(codexConfig)),
      integration: 'mcp',
      notify: loadCodexNotifyStatus(codexConfig),
      resolved_config_path: codexConfig,
      resolved_config_source: codexConfigured ? 'config_file' : 'platform_default',
    },
  }
}
