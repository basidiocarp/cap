import type { EcosystemStatus } from './api'

export interface CodexAdapterSummary {
  color: string
  detail: string
  label: string
}

export interface CodexModeSummary {
  color: string
  detail: string
  label: string
  optional: string[]
  ready: boolean
  required: string[]
}

export type CodexModeStepGroup = 'optional' | 'required'

export interface CodexModeStep {
  detail: string
  group: CodexModeStepGroup
  key: string
  label: string
  status: 'optional' | 'ready' | 'repair' | 'required'
}

export interface CodexModeSections {
  optional: CodexModeStep[]
  required: CodexModeStep[]
}

export interface CodexPresentationModel {
  adapter: CodexAdapterSummary
  mode: CodexModeSummary
  sections: CodexModeSections
}

export function missingLifecycleHooks(status: EcosystemStatus): string[] {
  return status.hooks.lifecycle.filter((hook) => !hook.installed).map((hook) => hook.event)
}

export function isClaudeHooksUnhealthy(status: EcosystemStatus): boolean {
  if (!status.agents.claude_code.adapter.configured) {
    return false
  }

  return status.hooks.installed_hooks.length === 0 || status.hooks.error_count > 0 || missingLifecycleHooks(status).length > 0
}

function isClaudeCoverageReady(status: EcosystemStatus): boolean {
  return status.agents.claude_code.adapter.configured && !isClaudeHooksUnhealthy(status)
}

export function getCodexModeSteps(status: EcosystemStatus): CodexModeStep[] {
  const steps: CodexModeStep[] = []

  steps.push({
    detail: status.mycelium.available
      ? 'Mycelium is installed and available for token-saving rewrites.'
      : 'Install Mycelium so Codex sessions can use rewrite and token-savings workflows.',
    group: 'required',
    key: 'mycelium',
    label: 'Mycelium',
    status: status.mycelium.available ? 'ready' : 'required',
  })

  steps.push({
    detail: status.hyphae.available
      ? 'Hyphae is installed for memory capture and session recall.'
      : 'Install Hyphae so Codex sessions can store notify summaries and recall context.',
    group: 'required',
    key: 'hyphae',
    label: 'Hyphae',
    status: status.hyphae.available ? 'ready' : 'required',
  })

  steps.push({
    detail: status.rhizome.available
      ? 'Rhizome is installed for code intelligence and symbol workflows.'
      : 'Install Rhizome so Codex can use code intelligence and symbol-edit flows.',
    group: 'required',
    key: 'rhizome',
    label: 'Rhizome',
    status: status.rhizome.available ? 'ready' : 'required',
  })

  steps.push({
    detail: status.agents.codex.adapter.configured
      ? 'Codex MCP is configured through ~/.codex/config.toml.'
      : 'Install the Codex profile or add the Codex MCP config so Codex can reach the ecosystem services.',
    group: 'required',
    key: 'codex-mcp',
    label: 'Codex MCP',
    status: status.agents.codex.adapter.configured ? 'ready' : 'required',
  })

  const codexNotify = status.agents.codex.notify
  let notifyStatus: CodexModeStep['status'] = 'required'
  let notifyDetail = 'Add notify = ["hyphae", "codex-notify"] so Codex can emit session summaries into Hyphae.'

  if (status.agents.codex.adapter.configured && codexNotify?.configured && codexNotify.contract_matched) {
    notifyStatus = 'ready'
    notifyDetail = 'The hyphae codex-notify adapter is configured and matches the expected contract.'
  } else if (status.agents.codex.adapter.configured && codexNotify?.configured && !codexNotify.contract_matched) {
    notifyStatus = 'repair'
    notifyDetail = 'Codex notify is configured, but it does not match notify = ["hyphae", "codex-notify"].'
  } else if (!status.agents.codex.adapter.configured) {
    notifyDetail = 'Finish Codex MCP setup first, then add the hyphae codex-notify adapter.'
  }

  steps.push({
    detail: notifyDetail,
    group: 'required',
    key: 'codex-notify',
    label: 'Codex notify',
    status: notifyStatus,
  })

  let claudeStatus: CodexModeStep['status'] = 'optional'
  let claudeDetail = 'Claude lifecycle hooks are optional unless you also use Claude Code alongside Codex.'

  if (status.agents.claude_code.adapter.configured && isClaudeHooksUnhealthy(status)) {
    claudeStatus = 'repair'
    claudeDetail = 'Claude hooks are installed but need repair. Fix them if you use Claude Code alongside Codex.'
  } else if (status.agents.claude_code.adapter.configured) {
    claudeStatus = 'ready'
    claudeDetail = 'Claude lifecycle hooks are available, so Claude Code can use the ecosystem alongside Codex.'
  }

  steps.push({
    detail: claudeDetail,
    group: 'optional',
    key: 'claude-hooks',
    label: 'Claude hooks',
    status: claudeStatus,
  })

  return steps
}

export function getCodexModeSections(status: EcosystemStatus): CodexModeSections {
  const steps = getCodexModeSteps(status)

  return {
    optional: steps.filter((step) => step.group === 'optional'),
    required: steps.filter((step) => step.group === 'required'),
  }
}

export function summarizeCodexAdapter(status: EcosystemStatus): CodexAdapterSummary {
  const { codex } = status.agents
  const notify = codex.notify

  if (!codex.configured) {
    return {
      color: 'gray',
      detail: 'No Codex config.toml was detected yet. Open onboarding to install the Codex profile and MCP config.',
      label: 'Not configured',
    }
  }

  if (!notify?.configured) {
    return {
      color: 'orange',
      detail:
        'Codex MCP is configured, but notify = ["hyphae", "codex-notify"] is missing. Open onboarding to restore the missing adapter.',
      label: 'MCP only',
    }
  }

  if (!notify.contract_matched) {
    return {
      color: 'orange',
      detail: 'Codex notify is present, but it does not match notify = ["hyphae", "codex-notify"]. Open onboarding to repair the contract.',
      label: 'Notify mismatch',
    }
  }

  return {
    color: 'mycelium',
    detail: 'Codex MCP and the hyphae codex-notify adapter are configured.',
    label: 'Notify adapter',
  }
}

function codexRequiredSteps(status: EcosystemStatus): string[] {
  return getCodexModeSections(status)
    .required.filter((step) => step.status === 'required' || step.status === 'repair')
    .map((step) => (step.label === 'Codex notify' && step.status === 'repair' ? 'Fix the Codex notify contract' : step.label))
}

function codexOptionalSteps(status: EcosystemStatus): string[] {
  return getCodexModeSections(status)
    .optional.filter((step) => step.status === 'optional')
    .map((step) => step.detail)
}

export function summarizeCodexMode(status: EcosystemStatus): CodexModeSummary {
  const required = codexRequiredSteps(status)
  const optional = codexOptionalSteps(status)
  const codex = status.agents.codex
  const claudeReady = isClaudeCoverageReady(status)
  const claudeConfigured = status.agents.claude_code.adapter.configured
  const claudeNeedsRepair = claudeConfigured && isClaudeHooksUnhealthy(status)

  if (!codex.configured) {
    return {
      color: 'gray',
      detail:
        'Install the Codex profile and the hyphae notify adapter to make Codex coverage usable. Open onboarding for the exact repair steps, and Claude coverage can coexist once its hooks are configured.',
      label: 'Codex not configured',
      optional,
      ready: false,
      required,
    }
  }

  if (!codex.notify?.configured) {
    return {
      color: 'orange',
      detail:
        'Codex MCP is configured, but the hyphae notify adapter is still missing. Open onboarding to fix Codex notify, then Claude coverage can still coexist alongside it.',
      label: 'Codex partial',
      optional,
      ready: false,
      required,
    }
  }

  if (!codex.notify.contract_matched) {
    return {
      color: 'orange',
      detail:
        'Codex notify is present, but it does not match the expected notify = ["hyphae", "codex-notify"] contract. Open onboarding to repair the contract.',
      label: 'Codex needs repair',
      optional,
      ready: false,
      required,
    }
  }

  if (required.length > 0) {
    return {
      color: 'orange',
      detail: `Codex coverage is missing: ${required.join(', ')}. Open onboarding to repair the missing steps; Claude lifecycle capture can run alongside it when needed.`,
      label: 'Codex partial',
      optional,
      ready: false,
      required,
    }
  }

  if (claudeReady) {
    return {
      color: 'mycelium',
      detail: 'Codex and Claude are both configured. Mycelium, Hyphae, and Rhizome are available across both hosts.',
      label: 'Codex + Claude ready',
      optional,
      ready: true,
      required,
    }
  }

  if (claudeNeedsRepair) {
    return {
      color: 'orange',
      detail:
        'Codex coverage is ready. Claude is also configured, but its lifecycle hooks need repair before both hosts are fully healthy together. Open onboarding to fix the missing lifecycle events.',
      label: 'Codex ready, Claude needs repair',
      optional,
      ready: true,
      required,
    }
  }

  return {
    color: 'mycelium',
    detail:
      'Mycelium, Hyphae, Rhizome, Codex MCP, and Codex notify are configured. Claude lifecycle capture can be added alongside Codex if you use both hosts.',
    label: 'Codex ready',
    optional,
    ready: required.length === 0,
    required,
  }
}

export function getCodexPresentationModel(status: EcosystemStatus): CodexPresentationModel {
  return {
    adapter: summarizeCodexAdapter(status),
    mode: summarizeCodexMode(status),
    sections: getCodexModeSections(status),
  }
}
