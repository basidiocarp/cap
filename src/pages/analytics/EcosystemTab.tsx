import { Alert, Badge, Button, Grid, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { EcosystemStatus } from '../../lib/api'
import { ActionEmptyState } from '../../components/ActionEmptyState'
import { SectionCard } from '../../components/SectionCard'

export function EcosystemTab({ data }: { data: EcosystemStatus | null }) {
  if (!data) {
    return (
      <ActionEmptyState
        actions={
          <>
            <Button
              component={Link}
              size='xs'
              to='/status'
              variant='light'
            >
              Open status
            </Button>
            <Button
              component={Link}
              size='xs'
              to='/onboard'
              variant='subtle'
            >
              Open onboarding
            </Button>
          </>
        }
        description='Cap could not load the live ecosystem status snapshot.'
        hint='This tab is a current-health summary for Mycelium, Hyphae, and Rhizome. It is not a historical analytics stream.'
        title='Ecosystem status is unavailable'
      />
    )
  }

  return (
    <Stack>
      <Alert
        color='gray'
        title='What this tab summarizes'
      >
        Ecosystem status is a live snapshot of current tool health and wiring. Use the other analytics tabs for historical Mycelium, Hyphae,
        Rhizome, or host telemetry trends.
      </Alert>

      <SectionCard title='Service Status'>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap='xs'>
              <Badge
                color={data.mycelium.available ? 'mycelium' : 'decay'}
                size='lg'
                variant='filled'
              >
                Mycelium: {data.mycelium.available ? 'Connected' : 'Not Connected'}
              </Badge>
              {data.mycelium.version && (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  v{data.mycelium.version}
                </Text>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap='xs'>
              <Badge
                color={data.hyphae.available ? 'mycelium' : 'decay'}
                size='lg'
                variant='filled'
              >
                Hyphae: {data.hyphae.available ? 'Connected' : 'Not Connected'}
              </Badge>
              {data.hyphae.available && (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  {data.hyphae.memories} memories, {data.hyphae.memoirs} memoirs
                  {data.hyphae.version ? ` · v${data.hyphae.version}` : ''}
                </Text>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap='xs'>
              <Badge
                color={data.rhizome.available ? 'mycelium' : 'decay'}
                size='lg'
                variant='filled'
              >
                Rhizome: {data.rhizome.available ? 'Connected' : 'Not Connected'}
              </Badge>
              {data.rhizome.available && (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  {data.rhizome.languages.length} languages
                </Text>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard title='Integration Connections'>
        <Stack gap='sm'>
          <Group>
            <Badge
              color={data.mycelium.available && data.hyphae.available ? 'mycelium' : 'decay'}
              variant='light'
            >
              Mycelium → Hyphae
            </Badge>
            <Text
              c='dimmed'
              size='sm'
            >
              {data.mycelium.available && data.hyphae.available ? 'Context chunking active' : 'Not connected'}
            </Text>
          </Group>
          <Group>
            <Badge
              color={data.rhizome.available && data.hyphae.available ? 'mycelium' : 'decay'}
              variant='light'
            >
              Rhizome → Hyphae
            </Badge>
            <Text
              c='dimmed'
              size='sm'
            >
              {data.rhizome.available && data.hyphae.available ? 'Code memoir export active' : 'Not connected'}
            </Text>
          </Group>
        </Stack>
      </SectionCard>
    </Stack>
  )
}
