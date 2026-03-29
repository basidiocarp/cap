import { Alert, Badge, Button, Group, NumberInput, Stack, Text, Title } from '@mantine/core'
import { IconBrain, IconDatabase } from '@tabler/icons-react'
import { useState } from 'react'

import type { EcosystemSettings } from '../../lib/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { ResolvedPathDetails } from '../../components/ResolvedPathDetails'
import { SectionCard } from '../../components/SectionCard'
import { usePruneHyphae } from '../../lib/queries'
import { memoirsHref } from '../../lib/routes'
import { SettingsCardActions } from './SettingsCardActions'
import { formatBytes } from './settings-formatters'

export function HyphaeSettingsCard({ settings }: { settings: EcosystemSettings['hyphae'] }) {
  const prune = usePruneHyphae()
  const [threshold, setThreshold] = useState<number | string>('')

  return (
    <SectionCard h='100%'>
      <Group mb='md'>
        <IconDatabase size={20} />
        <Title order={4}>Hyphae</Title>
      </Group>
      <Stack gap='sm'>
        <ResolvedPathDetails
          label='Resolved config file'
          note='Hyphae will read this path if you add local config overrides.'
          path={settings.resolved_config_path}
          source={settings.config_source}
        />
        <ResolvedPathDetails
          label='Resolved database path'
          note='This is the Hyphae database Cap is reading for memories and memoirs.'
          path={settings.db_path}
          source={settings.db_source}
        />
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
        <SettingsCardActions
          primaryHref='/memories'
          primaryLabel='Open memories'
          secondaryHref={memoirsHref()}
          secondaryLabel='Open memoirs'
        />
      </Stack>
    </SectionCard>
  )
}
