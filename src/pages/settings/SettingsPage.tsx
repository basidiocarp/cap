import { Alert, Grid, Stack, Tabs, Title } from '@mantine/core'
import { IconServer, IconSettings } from '@tabler/icons-react'

import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { ToolingUnavailableState } from '../../components/ToolingUnavailableState'
import { getToolSettingsGuidance } from '../../lib/host-guidance'
import { useSettings } from '../../lib/queries'
import { HyphaeSettingsCard } from './HyphaeSettingsCard'
import { LspManager } from './LspManager'
import { ModeSelector } from './ModeSelector'
import { MyceliumSettingsCard } from './MyceliumSettingsCard'
import { RhizomeSettingsCard } from './RhizomeSettingsCard'

export function SettingsPage() {
  const { data: settings, error, isLoading, refetch } = useSettings()
  const toolGuidance = getToolSettingsGuidance()

  if (isLoading) {
    return <PageLoader mt='xl' />
  }

  if (!settings) {
    return (
      <Stack>
        <Title order={2}>Settings</Title>

        <ErrorAlert error={error} />

        <ToolingUnavailableState
          description='Cap could not load tool settings for this environment.'
          hint='Settings only tune tools that are already installed. If this keeps failing, check Status first to confirm the ecosystem is reachable, then use Onboarding for missing adapters or setup repair.'
          includeSettingsLink={false}
          onRetry={() => void refetch()}
          retryLabel='Retry loading settings'
          title='Settings are unavailable'
        />
      </Stack>
    )
  }

  return (
    <Stack>
      <Title order={2}>Settings</Title>

      <Alert
        color='gray'
        title={toolGuidance.title}
      >
        {toolGuidance.detail}
      </Alert>

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

            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <MyceliumSettingsCard settings={settings.mycelium} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <HyphaeSettingsCard settings={settings.hyphae} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <RhizomeSettingsCard settings={settings.rhizome} />
              </Grid.Col>
            </Grid>
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
