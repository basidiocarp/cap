import { Alert, Badge, Button, Grid, Group, NumberInput, Stack, Text, Title } from '@mantine/core'
import { IconBrain, IconCode, IconDatabase, IconSettings } from '@tabler/icons-react'
import { useState } from 'react'

import type { EcosystemSettings } from '../lib/api'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { usePruneHyphae, useSettings } from '../lib/queries'

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }
  return `${(bytes / 1024).toFixed(2)} KB`
}

function EnabledBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <Badge
      color={enabled ? 'mycelium' : 'gray'}
      size='sm'
      variant='light'
    >
      {label}: {enabled ? 'Enabled' : 'Disabled'}
    </Badge>
  )
}

function ConfigPath({ path }: { path: string | null }) {
  return (
    <Group gap='xs'>
      <Text
        c='dimmed'
        size='sm'
      >
        Config:
      </Text>
      <Text size='sm'>{path ?? 'Not set'}</Text>
    </Group>
  )
}

function MyceliumCard({ settings }: { settings: EcosystemSettings['mycelium'] }) {
  return (
    <SectionCard h='100%'>
      <Group mb='md'>
        <IconSettings size={20} />
        <Title order={4}>Mycelium</Title>
      </Group>
      <Stack gap='sm'>
        <ConfigPath path={settings.config_path} />
        <Group gap='xs'>
          <EnabledBadge
            enabled={settings.filters.hyphae.enabled}
            label='Hyphae integration'
          />
          <EnabledBadge
            enabled={settings.filters.rhizome.enabled}
            label='Rhizome integration'
          />
        </Group>
      </Stack>
    </SectionCard>
  )
}

function HyphaeCard({ settings }: { settings: EcosystemSettings['hyphae'] }) {
  const prune = usePruneHyphae()
  const [threshold, setThreshold] = useState<number | string>('')

  return (
    <SectionCard h='100%'>
      <Group mb='md'>
        <IconDatabase size={20} />
        <Title order={4}>Hyphae</Title>
      </Group>
      <Stack gap='sm'>
        <ConfigPath path={settings.config_path} />
        <Group gap='xs'>
          <Text
            c='dimmed'
            size='sm'
          >
            Database:
          </Text>
          <Text size='sm'>{settings.db_path}</Text>
        </Group>
        <Badge
          color='spore'
          size='sm'
          variant='outline'
        >
          {formatBytes(settings.db_size_bytes)}
        </Badge>

        <NumberInput
          label='Prune threshold (days)'
          min={1}
          onChange={setThreshold}
          placeholder='Default'
          size='sm'
          value={threshold}
        />
        <Button
          color='gill'
          loading={prune.isPending}
          onClick={() => prune.mutate(typeof threshold === 'number' ? threshold : undefined)}
          size='sm'
          variant='light'
        >
          <IconBrain size={16} />
          <Text
            ml={6}
            size='sm'
          >
            Prune expired
          </Text>
        </Button>

        {prune.isSuccess && (
          <Alert
            color='mycelium'
            title='Prune complete'
          >
            {prune.data.message} ({prune.data.pruned} pruned)
          </Alert>
        )}
        {prune.isError && (
          <ErrorAlert
            error={prune.error}
            title='Prune failed'
          />
        )}
      </Stack>
    </SectionCard>
  )
}

function RhizomeCard({ settings }: { settings: EcosystemSettings['rhizome'] }) {
  return (
    <SectionCard h='100%'>
      <Group mb='md'>
        <IconCode size={20} />
        <Title order={4}>Rhizome</Title>
      </Group>
      <Stack gap='sm'>
        <ConfigPath path={settings.config_path} />
        <Group gap='xs'>
          <EnabledBadge
            enabled={settings.auto_export}
            label='Auto-export'
          />
          <Badge
            color='lichen'
            size='sm'
            variant='outline'
          >
            {settings.languages_enabled} languages
          </Badge>
        </Group>
      </Stack>
    </SectionCard>
  )
}

export function Settings() {
  const { data: settings, error, isLoading } = useSettings()

  if (isLoading) {
    return <PageLoader mt='xl' />
  }

  return (
    <Stack>
      <Title order={2}>Settings</Title>

      <ErrorAlert error={error} />

      {settings && (
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <MyceliumCard settings={settings.mycelium} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <HyphaeCard settings={settings.hyphae} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <RhizomeCard settings={settings.rhizome} />
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  )
}
