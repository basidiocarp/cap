import { Alert, Badge, Button, Card, Group, Stack, Table, Text } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { EcosystemStatus } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { timeAgo } from '../../lib/time'
import { getLifecycleAdaptersModel } from './lifecycleModel'
import { HookSummaryIcon } from './statusHelpers'

export function LifecycleAdaptersCard({ status }: { status: EcosystemStatus }) {
  const { emptyState, hasErrors, hooks, missingLifecycle, summary } = getLifecycleAdaptersModel(status)
  const lifecycleRepairRelevant = !summary.label.startsWith('Optional for ')

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
          {hooks.lifecycle.map((hook, index) => (
            <Badge
              color={hook.installed ? 'mycelium' : 'gray'}
              key={`${hook.event}-${index}`}
              size='sm'
              variant='light'
            >
              {hook.event}
              {hook.matching_hooks > 1 ? ` (${hook.matching_hooks})` : ''}
            </Badge>
          ))}
        </Group>
        {missingLifecycle.length > 0 && lifecycleRepairRelevant && (
          <Stack gap='xs'>
            <Text
              c='dimmed'
              size='xs'
            >
              Missing recommended lifecycle events: {missingLifecycle.join(', ')}
            </Text>
            <Button
              component={Link}
              size='xs'
              to='/onboard'
              variant='subtle'
            >
              Open onboarding
            </Button>
          </Stack>
        )}
      </Stack>

      {hooks.installed_hooks.length === 0 ? (
        <Alert
          color='gray'
          title={emptyState.title}
        >
          <Stack gap='xs'>
            <Text size='sm'>{emptyState.detail}</Text>
            {lifecycleRepairRelevant && (
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
