import { Badge, Button, Grid, Group, Stack, Text } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { EcosystemStatus } from '../../lib/api'
import { summarizeHyphaeMemoryFlow } from '../../lib/hyphae'
import { StatusToolCard } from './StatusToolCard'

export function StatusToolCards({ status }: { status: EcosystemStatus }) {
  const hyphaeFlow = summarizeHyphaeMemoryFlow(status)

  return (
    <>
      <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
        <StatusToolCard
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
        </StatusToolCard>
      </Grid.Col>

      <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
        <StatusToolCard
          available={status.hyphae.available}
          description='Persistent memory store'
          title='Hyphae'
        >
          <Stack gap='xs'>
            <Group justify='space-between'>
              {status.hyphae.version && (
                <Badge
                  color='spore'
                  size='sm'
                  variant='light'
                >
                  v{status.hyphae.version}
                </Badge>
              )}
              {hyphaeFlow && (
                <Badge
                  color={hyphaeFlow.color}
                  leftSection={hyphaeFlow.label === 'Flowing' ? <IconCircleCheck size={12} /> : <IconAlertCircle size={12} />}
                  size='sm'
                  variant='light'
                >
                  {hyphaeFlow.label}
                </Badge>
              )}
            </Group>

            {hyphaeFlow && (
              <Text
                c='dimmed'
                size='sm'
              >
                {hyphaeFlow.detail}
              </Text>
            )}

            {status.hyphae.available && (
              <Group gap='xs'>
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
                <Badge
                  color='gray'
                  size='sm'
                  variant='outline'
                >
                  {status.hyphae.activity.codex_memory_count} Codex
                </Badge>
              </Group>
            )}

            {status.hyphae.activity.last_session_topic && (
              <Text
                c='dimmed'
                size='xs'
              >
                Last session topic: {status.hyphae.activity.last_session_topic}
              </Text>
            )}

            <Group gap='xs'>
              <Button
                component={Link}
                size='xs'
                to='/memories'
                variant='subtle'
              >
                Review memories
              </Button>
            </Group>

            {!status.hyphae.available && (
              <Text
                c='dimmed'
                size='xs'
              >
                Install with: cargo install hyphae
              </Text>
            )}
          </Stack>
        </StatusToolCard>
      </Grid.Col>

      <Grid.Col span={{ base: 12, lg: 6, md: 12 }}>
        <StatusToolCard
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
        </StatusToolCard>
      </Grid.Col>
    </>
  )
}
