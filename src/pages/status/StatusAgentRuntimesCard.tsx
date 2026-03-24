import { Badge, Card, Group, Stack, Text } from '@mantine/core'

import type { EcosystemStatus } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { summarizeCodexAdapter } from '../../lib/codex'
import { getAgentRuntimeGuidance } from '../../lib/host-guidance'

export function StatusAgentRuntimesCard({ status }: { status: EcosystemStatus }) {
  const runtimeGuidance = getAgentRuntimeGuidance()
  const runtimes = [
    { key: 'claude-code', label: 'Claude Code', status: status.agents.claude_code },
    { key: 'codex', label: 'Codex', status: status.agents.codex },
  ] as const
  const codexAdapter = summarizeCodexAdapter(status)

  return (
    <SectionCard title='Agent runtimes'>
      <Stack gap='sm'>
        <Text
          c='dimmed'
          size='sm'
        >
          {runtimeGuidance.detail}
        </Text>
        {runtimes.map((runtime) => {
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
                  {runtime.key === 'codex' ? codexAdapter.detail : (runtime.status.config_path ?? 'No config file detected yet.')}
                </Text>
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </SectionCard>
  )
}
