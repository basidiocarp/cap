import { Drawer, SegmentedControl, Stack, Text } from '@mantine/core'
import { IconSettings2 } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'

import type { DashboardVariant } from '../stores/dashboard-variant-store'
import { useDashboardVariantStore } from '../stores/dashboard-variant-store'

export function TweaksPanel() {
  const [opened, { open, close }] = useDisclosure(false)
  const { variant, setVariant } = useDashboardVariantStore()

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
        </Stack>
      </Drawer>
    </>
  )
}
