import { Group, Stack, Switch, Text, Title } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'

import type { EcosystemSettings } from '../../lib/api'
import { ResolvedPathDetails } from '../../components/ResolvedPathDetails'
import { SectionCard } from '../../components/SectionCard'
import { useUpdateMycelium } from '../../lib/queries'
import { SettingsCardActions } from './SettingsCardActions'

export function MyceliumSettingsCard({ settings }: { settings: EcosystemSettings['mycelium'] }) {
  const update = useUpdateMycelium()

  return (
    <SectionCard h='100%'>
      <Group mb='md'>
        <IconSettings size={20} />
        <Title order={4}>Mycelium</Title>
      </Group>
      <Stack gap='sm'>
        <ResolvedPathDetails
          label='Resolved config file'
          note='Cap writes Mycelium settings here when you toggle integrations on this page.'
          path={settings.resolved_config_path}
          source={settings.config_source}
        />
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
        <SettingsCardActions
          primaryHref='/analytics'
          primaryLabel='Open analytics'
          secondaryHref='/status'
          secondaryLabel='Check status'
        />
      </Stack>
    </SectionCard>
  )
}
