import { Alert, Badge, Button, Card, Grid, Group, List, Stack, Table, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconArrowRight, IconCircleCheck, IconCircleX, IconRefresh } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { EcosystemStatus } from '../lib/api'
import { EcosystemFlow } from '../components/EcosystemFlow'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { ProjectSelector } from '../components/ProjectSelector'
import { SectionCard } from '../components/SectionCard'
import { buildOnboardingActions, missingLifecycleHooks, summarizeCodexIntegration, summarizeOnboarding } from '../lib/onboarding'
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

function summarizeHookHealth(status: EcosystemStatus): {
  color: string
  detail: string
  label: string
} {
  const missingLifecycle = missingLifecycleHooks(status)
  const hookCount = status.hooks.installed_hooks.length
  const codexConfigured = status.agents.codex.adapter.configured
  const claudeConfigured = status.agents.claude_code.adapter.configured
  const codexSummary = summarizeCodexIntegration(status)

  if (!claudeConfigured && codexConfigured) {
    return {
      color: codexSummary.color,
      detail:
        codexSummary.label === 'Notify adapter'
          ? 'Codex is configured through MCP and the notify adapter. Claude lifecycle coverage is optional until you wire Claude Code in as well.'
          : codexSummary.detail,
      label: codexSummary.label === 'Notify adapter' ? 'Codex ready' : codexSummary.label,
    }
  }

  if (hookCount === 0 && codexConfigured) {
    return {
      color: codexSummary.color,
      detail:
        codexSummary.label === 'Notify adapter'
          ? 'No Claude lifecycle adapter is installed. Codex already has its notify adapter coverage, so this only affects Claude-specific lifecycle capture.'
          : codexSummary.detail,
      label: codexSummary.label === 'Notify adapter' ? 'Optional' : codexSummary.label,
    }
  }

  if (hookCount === 0) {
    return {
      color: 'gray',
      detail: 'No Claude lifecycle adapter is installed yet.',
      label: 'Not configured',
    }
  }

  if (status.hooks.error_count > 0) {
    return {
      color: 'red',
      detail: `${status.hooks.error_count} recent hook errors were recorded.`,
      label: 'Needs repair',
    }
  }

  if (missingLifecycle.length > 0) {
    return {
      color: 'orange',
      detail: `Coverage is missing for ${missingLifecycle.join(', ')}.`,
      label: 'Partial coverage',
    }
  }

  return {
    color: 'mycelium',
    detail: 'Recommended lifecycle coverage is installed and no recent errors were recorded.',
    label: 'Covered',
  }
}

function HookSummaryIcon({ label }: { label: string }) {
  return ['Covered', 'Codex ready', 'Optional'].includes(label) ? <IconCircleCheck size={12} /> : <IconAlertCircle size={12} />
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
  const missingLifecycle = missingLifecycleHooks(status)
  const summary = summarizeHookHealth(status)
  const codexSummary = summarizeCodexIntegration(status)

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
          <Button
            component={Link}
            leftSection={<IconArrowRight size={14} />}
            size='xs'
            to='/onboard'
            variant='subtle'
          >
            Repair lifecycle
          </Button>
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
          {status.agents.codex.adapter.configured
            ? codexSummary.label === 'Notify adapter'
              ? 'Codex already has MCP and notify adapter coverage. Claude lifecycle capture is optional if you want SessionStart, PostToolUse, PreCompact, and SessionEnd.'
              : `Codex is ${codexSummary.label.toLowerCase()}. Claude lifecycle capture is optional unless you also want SessionStart, PostToolUse, PreCompact, and SessionEnd.`
            : 'Use onboarding to wire SessionStart, PostToolUse, PreCompact, and SessionEnd into Claude lifecycle capture.'}
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

function AgentRuntimeCard({ status }: { status: EcosystemStatus }) {
  const runtimes = [
    { key: 'claude-code', label: 'Claude Code', status: status.agents.claude_code },
    { key: 'codex', label: 'Codex', status: status.agents.codex },
  ] as const
  const codexSummary = summarizeCodexIntegration(status)

  return (
    <SectionCard title='Agent runtimes'>
      <Stack gap='sm'>
        <Text
          c='dimmed'
          size='sm'
        >
          Claude uses a lifecycle adapter. Codex uses MCP plus an optional hyphae notify adapter for turn-complete coverage.
        </Text>
        {runtimes.map((runtime) => {
          const badgeColor = runtime.status.configured ? 'mycelium' : runtime.status.detected ? 'orange' : 'gray'
          const badgeLabel =
            runtime.key === 'codex'
              ? runtime.status.configured
                ? 'MCP'
                : runtime.status.detected
                  ? 'Detected'
                  : 'Not found'
              : runtime.status.configured
                ? 'Configured'
                : runtime.status.detected
                  ? 'Detected'
                  : 'Not found'

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
                        color={codexSummary.color}
                        size='sm'
                        variant='light'
                      >
                        {codexSummary.label}
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
                  {runtime.key === 'codex' ? codexSummary.detail : (runtime.status.config_path ?? 'No config file detected yet.')}
                </Text>
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </SectionCard>
  )
}

function ProjectContextCard({ status }: { status: EcosystemStatus }) {
  const recentProjects = status.project.recent.filter((project) => project !== status.project.active)

  return (
    <SectionCard title='Project context'>
      <Stack gap='sm'>
        <Group
          align='start'
          justify='space-between'
        >
          <div style={{ flex: 1 }}>
            <Text
              c='dimmed'
              size='xs'
            >
              Active project
            </Text>
            <Text
              ff='monospace'
              size='sm'
            >
              {status.project.active}
            </Text>
          </div>
          <ProjectSelector variant='button' />
        </Group>

        <div>
          <Text
            c='dimmed'
            size='xs'
          >
            Workspace notes
          </Text>
          <Text
            c='dimmed'
            size='sm'
          >
            Switch here before checking Rhizome status if you want the dashboard to inspect a different repo or worktree.
          </Text>
        </div>

        {recentProjects.length > 0 ? (
          <div>
            <Text
              c='dimmed'
              mb={6}
              size='xs'
            >
              Recent projects
            </Text>
            <Group gap='xs'>
              {recentProjects.slice(0, 4).map((project) => (
                <Badge
                  color='gray'
                  key={project}
                  size='sm'
                  variant='outline'
                >
                  {project}
                </Badge>
              ))}
            </Group>
          </div>
        ) : (
          <Text
            c='dimmed'
            size='sm'
          >
            No other recent project contexts recorded yet.
          </Text>
        )}
      </Stack>
    </SectionCard>
  )
}

function GettingStartedCard({ status }: { status: EcosystemStatus }) {
  const actions = buildOnboardingActions(status)
    .filter((action) => action.tier !== 'manual')
    .slice(0, 3)
  const hookSummary = summarizeHookHealth(status)
  const codexSummary = summarizeCodexIntegration(status)

  return (
    <SectionCard title='Getting started'>
      <Stack gap='sm'>
        <Text size='sm'>{summarizeOnboarding(status)}</Text>
        <List
          c='dimmed'
          size='sm'
          spacing='xs'
        >
          <List.Item>Claude lifecycle adapter: {hookSummary.label.toLowerCase()}</List.Item>
          <List.Item>Codex adapter: {codexSummary.label.toLowerCase()}</List.Item>
          <List.Item>Active project: {status.project.active}</List.Item>
          <List.Item>Best next step: {actions[0]?.command ?? 'Open onboarding for guided repair'}</List.Item>
        </List>
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
        <Group gap='xs'>
          <Button
            component={Link}
            size='xs'
            to='/code'
            variant='subtle'
          >
            Open code explorer
          </Button>
          <Button
            component={Link}
            size='xs'
            to='/memories'
            variant='subtle'
          >
            Review memories
          </Button>
        </Group>
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
            <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
              <ProjectContextCard status={status} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
              <AgentRuntimeCard status={status} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
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

            <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
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

            <Grid.Col span={{ base: 12, lg: 6, md: 12 }}>
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
