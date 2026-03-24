import { Alert, Badge, Card, Group, Stack, Table, Text } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'

import type { EcosystemStatus } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { missingLifecycleHooks } from '../../lib/onboarding'
import { HookSummaryIcon, summarizeHookHealth, timeAgo } from './statusHelpers'

export function LanguageServersCard({ status }: { status: EcosystemStatus }) {
  const installed = status.lsps.filter((lsp) => lsp.available)
  const missing = status.lsps.filter((lsp) => !lsp.available)

  return (
    <SectionCard title='Language Servers'>
      {installed.length === 0 ? (
        <Text
          c='dimmed'
          size='sm'
        >
          No language servers detected.
        </Text>
      ) : (
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Server</Table.Th>
              <Table.Th>Language</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {installed.map((lsp) => (
              <Table.Tr key={lsp.bin}>
                <Table.Td>
                  <Text size='sm'>{lsp.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{lsp.language}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={lsp.running ? 'mycelium' : 'chitin'}
                    size='sm'
                    variant='light'
                  >
                    {lsp.running ? 'Running' : 'Installed'}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {missing.length > 0 && (
        <Stack
          gap='xs'
          mt='md'
        >
          <Text
            c='dimmed'
            size='xs'
          >
            Not found: {missing.map((lsp) => lsp.name).join(', ')}
          </Text>
        </Stack>
      )}
    </SectionCard>
  )
}

export function LifecycleAdaptersCard({ status }: { status: EcosystemStatus }) {
  const hooks = status.hooks
  const hasErrors = hooks.error_count > 0
  const missingLifecycle = missingLifecycleHooks(status)
  const summary = summarizeHookHealth(status)

  return (
    <SectionCard title='Lifecycle adapters'>
      <Stack
        gap='xs'
        mb='md'
      >
        <Group justify='space-between'>
          <Group gap='xs'>
            <Badge
              color={summary.color}
              leftSection={hasErrors ? <IconAlertCircle size={12} /> : <HookSummaryIcon label={summary.label} />}
              size='sm'
              variant='light'
            >
              {summary.label}
            </Badge>
            <Badge
              color='gray'
              size='sm'
              variant='outline'
            >
              {hooks.installed_hooks.length} installed
            </Badge>
          </Group>
        </Group>
        <Text
          c='dimmed'
          size='sm'
        >
          {summary.detail}
        </Text>
        <Text size='sm'>Recommended lifecycle coverage</Text>
        <Group gap='xs'>
          {hooks.lifecycle.map((hook) => (
            <Badge
              color={hook.installed ? 'mycelium' : 'gray'}
              key={hook.event}
              size='sm'
              variant='light'
            >
              {hook.event}
              {hook.matching_hooks > 1 ? ` (${hook.matching_hooks})` : ''}
            </Badge>
          ))}
        </Group>
        {missingLifecycle.length > 0 && (
          <Text
            c='dimmed'
            size='xs'
          >
            Missing recommended lifecycle events: {missingLifecycle.join(', ')}
          </Text>
        )}
      </Stack>

      {hooks.installed_hooks.length === 0 ? (
        <Alert
          color='gray'
          title='No Claude lifecycle adapter installed'
        >
          {status.agents.claude_code.adapter.configured
            ? 'Claude Code is detected, but no Claude lifecycle hooks are installed yet.'
            : 'No Claude lifecycle adapter is installed yet. Use onboarding to wire SessionStart, PostToolUse, PreCompact, and SessionEnd into Claude lifecycle capture.'}
        </Alert>
      ) : (
        <>
          <Group
            gap='xs'
            mb='md'
          >
            <Badge
              color={hasErrors ? 'red' : 'mycelium'}
              leftSection={hasErrors ? <IconAlertCircle size={12} /> : <IconCircleCheck size={12} />}
              size='sm'
              variant='light'
            >
              {hasErrors ? `${hooks.error_count} errors` : 'Healthy'}
            </Badge>
          </Group>

          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Event</Table.Th>
                <Table.Th>Matcher</Table.Th>
                <Table.Th>Command</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {hooks.installed_hooks.map((hook) => (
                <Table.Tr key={`${hook.event}-${hook.matcher}-${hook.command}`}>
                  <Table.Td>
                    <Badge
                      size='xs'
                      variant='outline'
                    >
                      {hook.event}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>{hook.matcher}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      {hook.command}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {hooks.recent_errors.length === 0 ? (
            <Text
              c='dimmed'
              mt='md'
              size='sm'
            >
              No recent lifecycle errors recorded.
            </Text>
          ) : (
            <Stack
              gap='xs'
              mt='md'
            >
              <Text
                c='red'
                fw={500}
                size='sm'
              >
                Recent lifecycle errors
              </Text>
              {hooks.recent_errors.slice(0, 5).map((error) => (
                <Card
                  bg='red.0'
                  key={`${error.timestamp}-${error.hook}-${error.message}`}
                  p='xs'
                  withBorder
                >
                  <Group justify='space-between'>
                    <div>
                      <Text size='xs'>{error.hook}</Text>
                      <Text
                        c='dimmed'
                        size='xs'
                      >
                        {error.message}
                      </Text>
                    </div>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      {timeAgo(error.timestamp)}
                    </Text>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}
    </SectionCard>
  )
}
