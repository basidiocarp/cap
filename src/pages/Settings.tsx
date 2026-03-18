import { Alert, Badge, Button, Grid, Group, NumberInput, SegmentedControl, Stack, Switch, Tabs, Text, Title } from '@mantine/core'
import { IconBrain, IconCode, IconDatabase, IconServer, IconSettings, IconShield } from '@tabler/icons-react'
import { useState } from 'react'

import type { EcosystemSettings } from '../lib/api'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useActivateMode, useModes, usePruneHyphae, useSettings, useUpdateMycelium, useUpdateRhizome } from '../lib/queries'
import { LspManager } from './settings/LspManager'

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }
  return `${(bytes / 1024).toFixed(2)} KB`
}

function MyceliumCard({ settings }: { settings: EcosystemSettings['mycelium'] }) {
  const update = useUpdateMycelium()

  return (
    <SectionCard h='100%'>
      <Group mb='md'>
        <IconSettings size={20} />
        <Title order={4}>Mycelium</Title>
      </Group>
      <Stack gap='sm'>
        <Group gap='xs'>
          <Text
            c='dimmed'
            size='sm'
          >
            Config:
          </Text>
          <Text size='sm'>{settings.config_path ?? 'Not set (using defaults)'}</Text>
        </Group>
        <Switch
          checked={settings.filters.hyphae.enabled}
          color='mycelium'
          label='Hyphae integration'
          onChange={(e) => update.mutate({ hyphae_enabled: e.currentTarget.checked })}
        />
        <Switch
          checked={settings.filters.rhizome.enabled}
          color='mycelium'
          label='Rhizome integration'
          onChange={(e) => update.mutate({ rhizome_enabled: e.currentTarget.checked })}
        />
        {update.isError && (
          <Text
            c='red'
            size='xs'
          >
            {update.error instanceof Error ? update.error.message : 'Update failed'}
          </Text>
        )}
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
        <Group gap='xs'>
          <Text
            c='dimmed'
            size='sm'
          >
            Config:
          </Text>
          <Text size='sm'>{settings.config_path ?? 'Not set (using defaults)'}</Text>
        </Group>
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
  const update = useUpdateRhizome()

  return (
    <SectionCard h='100%'>
      <Group mb='md'>
        <IconCode size={20} />
        <Title order={4}>Rhizome</Title>
      </Group>
      <Stack gap='sm'>
        <Group gap='xs'>
          <Text
            c='dimmed'
            size='sm'
          >
            Config:
          </Text>
          <Text size='sm'>{settings.config_path ?? 'Not set (using defaults)'}</Text>
        </Group>
        <Switch
          checked={settings.auto_export}
          color='mycelium'
          label='Auto-export to Hyphae'
          onChange={(e) => update.mutate({ auto_export: e.currentTarget.checked })}
        />
        <Badge
          color='lichen'
          size='sm'
          variant='outline'
        >
          {settings.languages_enabled} languages configured
        </Badge>
        {update.isError && (
          <Text
            c='red'
            size='xs'
          >
            {update.error instanceof Error ? update.error.message : 'Update failed'}
          </Text>
        )}
      </Stack>
    </SectionCard>
  )
}

const MODE_COLORS: Record<string, string> = {
  develop: 'mycelium',
  explore: 'lichen',
  review: 'spore',
}

function ModeSelector() {
  const { data: modeConfig } = useModes()
  const activate = useActivateMode()

  if (!modeConfig) return null

  const modeNames = Object.keys(modeConfig.modes)
  const activeMode = modeConfig.modes[modeConfig.active]

  return (
    <SectionCard>
      <Group mb='md'>
        <IconShield size={20} />
        <Title order={4}>Operational Mode</Title>
        <Badge
          color={MODE_COLORS[modeConfig.active] ?? 'gray'}
          size='sm'
        >
          {modeConfig.active}
        </Badge>
      </Group>
      <Stack gap='sm'>
        <SegmentedControl
          color={MODE_COLORS[modeConfig.active] ?? 'gray'}
          data={modeNames.map((name) => ({ label: name.charAt(0).toUpperCase() + name.slice(1), value: name }))}
          onChange={(value) => activate.mutate(value)}
          value={modeConfig.active}
        />
        {activeMode && (
          <Text
            c='dimmed'
            size='sm'
          >
            {activeMode.description}
          </Text>
        )}
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

      <Tabs defaultValue='config'>
        <Tabs.List>
          <Tabs.Tab
            leftSection={<IconSettings size={16} />}
            value='config'
          >
            Configuration
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconServer size={16} />}
            value='lsp'
          >
            Language Servers
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          pt='md'
          value='config'
        >
          <Stack>
            <ModeSelector />

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
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='lsp'
        >
          <LspManager />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
