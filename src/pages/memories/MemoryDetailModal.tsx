import { Badge, Group, Modal, Stack, Text } from '@mantine/core'

import type { Memory } from '../../lib/api'
import { importanceColor } from '../../lib/colors'
import { MemoryActionsSection } from './MemoryActionsSection'
import { MemoryMetadataSection } from './MemoryMetadataSection'
import { useMemoryDetailActions } from './useMemoryDetailActions'

export function MemoryDetailModal({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const memoryActions = useMemoryDetailActions(memory, onClose)
  const { detail } = memoryActions

  return (
    <Modal
      centered
      onClose={onClose}
      opened
      size='lg'
      title={
        <Group gap='sm'>
          <Text fw={600}>Memory Detail</Text>
          <Badge
            color={importanceColor(detail.importance)}
            size='sm'
            variant='light'
          >
            {detail.importance}
          </Badge>
        </Group>
      }
    >
      <Stack gap='md'>
        <MemoryMetadataSection detail={detail} />
        <MemoryActionsSection {...memoryActions} />
      </Stack>
    </Modal>
  )
}
