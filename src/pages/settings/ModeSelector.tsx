import { Badge, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { IconShield } from '@tabler/icons-react'

import { SectionCard } from '../../components/SectionCard'
import { useActivateMode, useModes } from '../../lib/queries'

const MODE_COLORS: Record<string, string> = {
  develop: 'mycelium',
  explore: 'lichen',
  review: 'spore',
}

export function ModeSelector() {
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
