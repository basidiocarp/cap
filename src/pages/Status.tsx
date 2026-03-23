import { Badge, Button, Card, Grid, Group, Stack, Table, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck, IconCircleX, IconRefresh } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { EcosystemStatus } from '../lib/api'
import { EcosystemFlow } from '../components/EcosystemFlow'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { buildOnboardingActions, summarizeOnboarding } from '../lib/onboarding'
import { useEcosystemStatus } from '../lib/queries'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <Badge
      color={available ? 'mycelium' : 'decay'}
      leftSection={available ? <IconCircleCheck size={12} /> : <IconCircleX size={12} />}
      size='sm'
      variant='light'
    >
      {available ? 'Available' : 'Unavailable'}
    </Badge>
  )
}

function ToolCard({
  available,
  children,
  description,
  title,
}: {
  available: boolean
  children?: React.ReactNode
  description: string
  title: string
}) {
  return (
    <SectionCard h='100%'>
      <Group
        justify='space-between'
        mb='md'
      >
        <Title order={4}>{title}</Title>
        <AvailabilityBadge available={available} />
      </Group>
      <Text
        c='dimmed'
        mb='sm'
        size='sm'
      >
        {description}
      </Text>
      {children}
    </SectionCard>
  )
}

function LspSection({ status }: { status: EcosystemStatus }) {
  const installed = status.lsps.filter((l) => l.available)
  const missing = status.lsps.filter((l) => !l.available)

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
            Not found: {missing.map((l) => l.name).join(', ')}
          </Text>
        </Stack>
      )}
    </SectionCard>
  )
}

function HooksSection({ status }: { status: EcosystemStatus }) {
  const hooks = status.hooks
  const hasErrors = hooks.error_count > 0

  return (
    <SectionCard title='Claude Code Hooks'>
      {hooks.installed_hooks.length === 0 ? (
        <Text
          c='dimmed'
          size='sm'
        >
          No hooks installed.
        </Text>
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

          {hooks.recent_errors.length > 0 && (
            <Stack
              gap='xs'
              mt='md'
            >
              <Text
                c='red'
                fw={500}
                size='sm'
              >
                Recent Errors
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

function GettingStartedCard({ status }: { status: EcosystemStatus }) {
  const actions = buildOnboardingActions(status)
    .filter((action) => action.tier !== 'manual')
    .slice(0, 3)

  return (
    <SectionCard title='Getting started'>
      <Stack gap='sm'>
        <Text size='sm'>{summarizeOnboarding(status)}</Text>
        <Group gap='xs'>
          {actions.map((action) => (
            <Badge
              color={action.tier === 'primary' ? 'mycelium' : 'substrate'}
              key={action.command}
              size='sm'
              variant='light'
            >
              {action.command}
            </Badge>
          ))}
        </Group>
        <Button
          component={Link}
          leftSection={<IconAlertCircle size={14} />}
          to='/onboard'
          variant='light'
        >
          Open onboarding
        </Button>
      </Stack>
    </SectionCard>
  )
}

export function Status() {
  const { data: status, error, isLoading, refetch } = useEcosystemStatus()

  if (isLoading) {
    return <PageLoader mt='xl' />
  }

  return (
    <Stack>
      <Group justify='space-between'>
        <div>
          <Title order={2}>Ecosystem Status</Title>
          <Text
            c='dimmed'
            size='sm'
          >
            Check what is installed, then jump to onboarding for the exact fix commands.
          </Text>
        </div>
        <Group>
          <Button
            component={Link}
            leftSection={<IconAlertCircle size={16} />}
            to='/onboard'
            variant='light'
          >
            Onboarding
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => refetch()}
            size='sm'
            variant='subtle'
          >
            Refresh
          </Button>
        </Group>
      </Group>

      <ErrorAlert error={error} />

      {status && (
        <>
          <GettingStartedCard status={status} />

          <Card
            p='md'
            shadow='sm'
            withBorder
          >
            <Title
              mb='sm'
              order={4}
            >
              Ecosystem Architecture
            </Title>
            <div style={{ height: 400 }}>
              <EcosystemFlow />
            </div>
          </Card>

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <ToolCard
                available={status.mycelium.available}
                description='Token compression proxy'
                title='Mycelium'
              >
                {status.mycelium.version && (
                  <Badge
                    color='mycelium'
                    size='sm'
                    variant='light'
                  >
                    v{status.mycelium.version}
                  </Badge>
                )}
                {!status.mycelium.available && (
                  <Text
                    c='dimmed'
                    mt='sm'
                    size='xs'
                  >
                    Install with: cargo install mycelium
                  </Text>
                )}
              </ToolCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <ToolCard
                available={status.hyphae.available}
                description='Persistent memory store'
                title='Hyphae'
              >
                {status.hyphae.version && (
                  <Badge
                    color='spore'
                    mb='sm'
                    size='sm'
                    variant='light'
                  >
                    v{status.hyphae.version}
                  </Badge>
                )}
                {status.hyphae.available && (
                  <Group
                    gap='lg'
                    mt='sm'
                  >
                    <Badge
                      color='spore'
                      size='sm'
                      variant='outline'
                    >
                      {status.hyphae.memories} memories
                    </Badge>
                    <Badge
                      color='spore'
                      size='sm'
                      variant='outline'
                    >
                      {status.hyphae.memoirs} memoirs
                    </Badge>
                  </Group>
                )}
                {!status.hyphae.available && (
                  <Text
                    c='dimmed'
                    mt='sm'
                    size='xs'
                  >
                    Install with: cargo install hyphae
                  </Text>
                )}
              </ToolCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <ToolCard
                available={status.rhizome.available}
                description='Code intelligence engine'
                title='Rhizome'
              >
                {status.rhizome.backend && (
                  <Badge
                    color='lichen'
                    mb='sm'
                    size='sm'
                    variant='light'
                  >
                    {status.rhizome.backend}
                  </Badge>
                )}
                {status.rhizome.languages.length > 0 && (
                  <Stack gap='xs'>
                    <Text size='sm'>{status.rhizome.languages.length} languages supported</Text>
                    <Group gap={4}>
                      {status.rhizome.languages.map((lang) => (
                        <Badge
                          color='lichen'
                          key={lang}
                          size='xs'
                          variant='outline'
                        >
                          {lang}
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                )}
                {!status.rhizome.available && (
                  <Text
                    c='dimmed'
                    mt='sm'
                    size='xs'
                  >
                    Install with: cargo install rhizome
                  </Text>
                )}
              </ToolCard>
            </Grid.Col>
          </Grid>

          <LspSection status={status} />

          <HooksSection status={status} />
        </>
      )}
    </Stack>
  )
}
