import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { EcosystemStatus } from '../../lib/api'
import { ResolvedPathDetails } from '../../components/ResolvedPathDetails'
import { SectionCard } from '../../components/SectionCard'
import { summarizeCodexAdapter } from '../../lib/codex'
import { getAgentRuntimeGuidance, getClaudeLifecycleAdapterEmptyState } from '../../lib/host-guidance'
import { getHostCoverageView } from '../../lib/readiness'
import { useHostCoverageStore } from '../../store/host-coverage'

export function StatusAgentRuntimesCard({ status }: { status: EcosystemStatus }) {
  const runtimeGuidance = getAgentRuntimeGuidance()
  const hostCoveragePreference = useHostCoverageStore((state) => state.mode)
  const hostCoverageView = getHostCoverageView(status, hostCoveragePreference)
  const runtimes = [
    { key: 'claude-code', label: 'Claude Code', status: status.agents.claude_code },
    { key: 'codex', label: 'Codex', status: status.agents.codex },
  ] as const
  const codexAdapter = summarizeCodexAdapter(status)
  const claudeEmptyState = getClaudeLifecycleAdapterEmptyState(status)
  const runtimeOrder = new Map(hostCoverageView.runtimeOrder.map((key, index) => [key, index]))
  const orderedRuntimes = [...runtimes].sort((a, b) => (runtimeOrder.get(a.key) ?? 0) - (runtimeOrder.get(b.key) ?? 0))

  return (
    <SectionCard title='Agent runtimes'>
      <Stack gap='sm'>
        <Group justify='space-between'>
          <Text
            c='dimmed'
            size='sm'
          >
            {runtimeGuidance.detail}
          </Text>
          <Badge
            color='gray'
            size='sm'
            variant='light'
          >
            {hostCoverageView.label}
          </Badge>
        </Group>
        {orderedRuntimes.map((runtime) => {
          const badgeColor = runtime.status.configured ? 'mycelium' : runtime.status.detected ? 'orange' : 'gray'
          const badgeLabel = runtime.status.configured ? 'Configured' : runtime.status.detected ? 'Detected' : 'Not found'

          return (
            <Card
              bg='var(--mantine-color-gray-0)'
              key={runtime.key}
              p='sm'
              withBorder
            >
              <Stack gap={6}>
                <Group justify='space-between'>
                  <Text
                    fw={600}
                    size='sm'
                  >
                    {runtime.status.adapter.label}
                  </Text>
                  <Group gap='xs'>
                    <Badge
                      color={badgeColor}
                      size='sm'
                      variant='light'
                    >
                      {badgeLabel}
                    </Badge>
                    {runtime.key === 'codex' ? (
                      <Badge
                        color={codexAdapter.color}
                        size='sm'
                        variant='light'
                      >
                        {codexAdapter.label}
                      </Badge>
                    ) : (
                      <Badge
                        color='gray'
                        size='sm'
                        variant='outline'
                      >
                        {runtime.status.adapter.kind}
                      </Badge>
                    )}
                  </Group>
                </Group>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  {runtime.key === 'codex'
                    ? codexAdapter.detail
                    : runtime.status.configured
                      ? (runtime.status.config_path ?? 'Claude lifecycle hooks are installed but no config path was recorded.')
                      : claudeEmptyState.detail}
                </Text>
                <ResolvedPathDetails
                  label='Resolved adapter config'
                  note={
                    runtime.key === 'codex'
                      ? 'This is the Codex config file Cap expects to read on this machine.'
                      : 'This is the Claude settings file Cap expects to read on this machine.'
                  }
                  path={runtime.status.resolved_config_path}
                  source={runtime.status.resolved_config_source}
                />
                {!runtime.status.configured && (
                  <Button
                    component={Link}
                    size='xs'
                    to='/onboard'
                    variant='subtle'
                  >
                    Open onboarding
                  </Button>
                )}
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </SectionCard>
  )
}
