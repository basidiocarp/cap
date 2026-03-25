import type { EcosystemStatus } from './api'
import { isClaudeHooksUnhealthy } from './codex'

export type HostCoverageMode = 'auto' | 'codex' | 'claude' | 'both'

export interface HostCoverageView {
  detail: string
  effectiveMode: Exclude<HostCoverageMode, 'auto'>
  label: string
  optionalSectionTitle: string
  preference: HostCoverageMode
  requiredSectionTitle: string
  runtimeOrder: Array<'claude-code' | 'codex'>
  usageNote: string
}

function hasClaudeCoverage(status: EcosystemStatus): boolean {
  return status.agents.claude_code.adapter.configured && !isClaudeHooksUnhealthy(status)
}

function hasCodexCoverage(status: EcosystemStatus): boolean {
  return status.agents.codex.adapter.configured
}

export function resolveHostCoverageMode(status: EcosystemStatus, preference: HostCoverageMode = 'auto'): Exclude<HostCoverageMode, 'auto'> {
  if (preference !== 'auto') return preference

  const codexCoverage = hasCodexCoverage(status)
  const claudeCoverage = hasClaudeCoverage(status)

  if (codexCoverage && claudeCoverage) return 'both'
  if (claudeCoverage) return 'claude'
  if (codexCoverage) return 'codex'

  return 'both'
}

export function getHostCoverageView(status: EcosystemStatus, preference: HostCoverageMode = 'auto'): HostCoverageView {
  const effectiveMode = resolveHostCoverageMode(status, preference)
  const claudeCoverage = hasClaudeCoverage(status)
  const codexCoverage = hasCodexCoverage(status)

  if (preference === 'auto') {
    return {
      detail:
        'Auto view follows the host coverage already configured in the ecosystem while keeping Claude Code and Codex visible together.',
      effectiveMode,
      label: 'Auto',
      optionalSectionTitle: 'Claude coverage',
      preference,
      requiredSectionTitle: 'Required for coverage',
      runtimeOrder: effectiveMode === 'claude' ? ['claude-code', 'codex'] : ['codex', 'claude-code'],
      usageNote: 'Presentation mode: usage history still includes both Claude Code and Codex sessions when they are present.',
    }
  }

  if (preference === 'claude') {
    return {
      detail: claudeCoverage
        ? 'Claude focus keeps lifecycle hooks prominent while still showing Codex coverage alongside them.'
        : 'Claude focus is selected, but Claude lifecycle hooks still need repair.',
      effectiveMode,
      label: 'Claude focus',
      optionalSectionTitle: 'Codex coverage',
      preference,
      requiredSectionTitle: 'Required for shared coverage',
      runtimeOrder: ['claude-code', 'codex'],
      usageNote: 'Presentation mode: usage history emphasizes Claude-facing health first, but Codex sessions are still included.',
    }
  }

  if (preference === 'both') {
    return {
      detail: 'Both view shows Claude Code and Codex coverage side by side without treating either host as secondary.',
      effectiveMode,
      label: 'Both hosts',
      optionalSectionTitle: 'Claude coverage',
      preference,
      requiredSectionTitle: 'Required for shared coverage',
      runtimeOrder: ['claude-code', 'codex'],
      usageNote: 'Presentation mode: usage history includes both Claude Code and Codex sessions equally.',
    }
  }

  return {
    detail: codexCoverage
      ? 'Codex focus keeps Codex setup prominent while Claude lifecycle coverage remains available alongside it.'
      : 'Codex focus is selected, but Codex coverage still needs repair.',
    effectiveMode,
    label: 'Codex focus',
    optionalSectionTitle: 'Claude coverage',
    preference,
    requiredSectionTitle: 'Required for Codex coverage',
    runtimeOrder: ['codex', 'claude-code'],
    usageNote: 'Presentation mode: usage history emphasizes Codex-facing health first, but Claude sessions are still included.',
  }
}
