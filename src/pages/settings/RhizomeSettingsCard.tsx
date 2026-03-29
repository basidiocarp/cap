import { Badge, Group, Stack, Switch, Text, Title } from '@mantine/core'
import { IconCode } from '@tabler/icons-react'

import type { EcosystemSettings } from '../../lib/api'
import { ResolvedPathDetails } from '../../components/ResolvedPathDetails'
import { SectionCard } from '../../components/SectionCard'
import { useUpdateRhizome } from '../../lib/queries'
import { codeExplorerHref } from '../../lib/routes'
import { SettingsCardActions } from './SettingsCardActions'

export function RhizomeSettingsCard({ settings }: { settings: EcosystemSettings['rhizome'] }) {
  const update = useUpdateRhizome()

  return (
    <SectionCard h='100%'>
      <Group mb='md'>
        <IconCode size={20} />
        <Title order={4}>Rhizome</Title>
      </Group>
      <Stack gap='sm'>
        <ResolvedPathDetails
          label='Resolved config file'
          note='Cap writes Rhizome settings here when you toggle auto-export.'
          path={settings.resolved_config_path}
          source={settings.config_source}
        />
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
        <SettingsCardActions
          primaryHref={codeExplorerHref()}
          primaryLabel='Open code explorer'
          secondaryHref='/status'
          secondaryLabel='Check status'
        />
      </Stack>
    </SectionCard>
  )
}
