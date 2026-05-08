import { ActionIcon, Drawer, Group, SegmentedControl, Stack, Switch, Text, Tooltip, useMantineColorScheme } from '@mantine/core'
import { IconSettings2 } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'

import type { AccentColor, DashboardVariant } from '../stores/dashboard-variant-store'
import { useDashboardVariantStore } from '../stores/dashboard-variant-store'

const accentColorMap: Record<AccentColor, string> = {
  mycelium: '#20c997',
  spore: '#845ef7',
  substrate: '#ffc107',
  gill: '#f76c6c',
}

export function TweaksPanel() {
  const [opened, { open, close }] = useDisclosure(false)
  const { variant, setVariant, accentColor, setAccentColor, compactDensity, setCompactDensity } =
    useDashboardVariantStore()
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  const handleCompactDensity = (value: boolean) => {
    setCompactDensity(value)
    document.body.dataset.compact = String(value)
  }

  return (
    <>
      <div
        onClick={open}
        style={{ bottom: 16, cursor: 'pointer', opacity: 0.6, position: 'fixed', right: 16, zIndex: 1000 }}
        title='Open tweaks panel'
      >
        <IconSettings2 size={20} />
      </div>
      <Drawer onClose={close} opened={opened} position='right' size='sm' title='Dev Tweaks'>
        <Stack gap='md'>
          <div>
            <Text fw={500} mb='xs' size='sm'>
              Dashboard Variant
            </Text>
            <SegmentedControl
              data={[
                { value: 'operator', label: 'Operator' },
                { value: 'confident', label: 'Confident' },
                { value: 'fieldlab', label: 'Field Lab' },
              ]}
              fullWidth
              onChange={(v) => setVariant(v as DashboardVariant)}
              value={variant}
            />
          </div>

          <div>
            <Text fw={500} mb='xs' size='sm'>
              Theme
            </Text>
            <SegmentedControl
              data={[
                { label: 'Dark', value: 'dark' },
                { label: 'Light', value: 'light' },
              ]}
              fullWidth
              onChange={(v) => setColorScheme(v as 'light' | 'dark')}
              value={colorScheme || 'dark'}
            />
          </div>

          <div>
            <Text fw={500} mb='xs' size='sm'>
              Accent Color
            </Text>
            <Group>
              {Object.entries(accentColorMap).map(([key, hex]) => (
                <ActionIcon
                  key={key}
                  onClick={() => setAccentColor(key as AccentColor)}
                  size='lg'
                  style={{
                    backgroundColor: hex,
                    ...(accentColor === key && { outline: '2px solid white', outlineOffset: 2 }),
                  }}
                  variant={accentColor === key ? 'default' : 'default'}
                />
              ))}
            </Group>
          </div>

          <div>
            <Text fw={500} mb='xs' size='sm'>
              Compact Density
            </Text>
            <Switch
              checked={compactDensity}
              onChange={(e) => handleCompactDensity(e.currentTarget.checked)}
            />
          </div>

          <div>
            <Text fw={500} mb='xs' size='sm'>
              Live Data
            </Text>
            <Tooltip label='Coming soon'>
              <Switch disabled />
            </Tooltip>
          </div>
        </Stack>
      </Drawer>
    </>
  )
}
