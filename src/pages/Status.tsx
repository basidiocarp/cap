import { Alert, Badge, Button, Card, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { IconCircleCheck, IconCircleX, IconRefresh } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'

import type { EcosystemStatus } from '../lib/api'
import { statusApi } from '../lib/api'

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <Badge
      color={available ? 'mycelium' : 'decay'}
      leftSection={available ? <IconCircleCheck size={12} /> : <IconCircleX size={12} />}
      size='sm'
    >
      {available ? 'Available' : 'Unavailable'}
    </Badge>
  )
}

export function Status() {
  const [status, setStatus] = useState<EcosystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await statusApi.ecosystem()
      setStatus(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ecosystem status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  if (loading) {
    return (
      <Group
        justify='center'
        mt='xl'
      >
        <Loader />
      </Group>
    )
  }

  return (
    <Stack>
      <Group justify='space-between'>
        <Title order={2}>Ecosystem Status</Title>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={fetchStatus}
          size='sm'
          variant='subtle'
        >
          Refresh
        </Button>
      </Group>

      {error && (
        <Alert
          color='decay'
          onClose={() => setError(null)}
          title='Error'
          withCloseButton
        >
          {error}
        </Alert>
      )}

      {status && (
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card
              padding='lg'
              shadow='sm'
              withBorder
            >
              <Group
                justify='space-between'
                mb='md'
              >
                <Title order={4}>Mycelium</Title>
                <AvailabilityBadge available={status.mycelium.available} />
              </Group>
              <Text
                c='dimmed'
                mb='sm'
                size='sm'
              >
                Token compression proxy
              </Text>
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
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card
              padding='lg'
              shadow='sm'
              withBorder
            >
              <Group
                justify='space-between'
                mb='md'
              >
                <Title order={4}>Hyphae</Title>
                <AvailabilityBadge available={status.hyphae.available} />
              </Group>
              <Text
                c='dimmed'
                mb='sm'
                size='sm'
              >
                Persistent memory store
              </Text>
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
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card
              padding='lg'
              shadow='sm'
              withBorder
            >
              <Group
                justify='space-between'
                mb='md'
              >
                <Title order={4}>Rhizome</Title>
                <AvailabilityBadge available={status.rhizome.available} />
              </Group>
              <Text
                c='dimmed'
                mb='sm'
                size='sm'
              >
                Code intelligence engine
              </Text>
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
            </Card>
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  )
}
