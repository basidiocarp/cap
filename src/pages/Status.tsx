import { Badge, Button, Card, Grid, Group, Stack, Table, Text, Title } from '@mantine/core'
import { IconCircleCheck, IconCircleX, IconRefresh } from '@tabler/icons-react'

import type { EcosystemStatus } from '../lib/api'
import { EcosystemFlow } from '../components/EcosystemFlow'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useEcosystemStatus } from '../lib/queries'

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

export function Status() {
  const { data: status, error, isLoading, refetch } = useEcosystemStatus()

  if (isLoading) {
    return <PageLoader mt='xl' />
  }

  return (
    <Stack>
      <Group justify='space-between'>
        <Title order={2}>Ecosystem Status</Title>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={() => refetch()}
          size='sm'
          variant='subtle'
        >
          Refresh
        </Button>
      </Group>

      <ErrorAlert error={error} />

      {status && (
        <>
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
        </>
      )}
    </Stack>
  )
}
