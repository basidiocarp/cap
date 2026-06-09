import { Badge, Group, Modal, Stack, Text } from '@mantine/core'

import type { Memory } from '../../lib/api'
import { importanceColor } from '../../lib/colors'
import { MemoryActionsSection } from './MemoryActionsSection'
import { MemoryMetadataSection } from './MemoryMetadataSection'
import { useMemoryDetailActions } from './useMemoryDetailActions'

export function MemoryDetailModal({ memory, onClose, onWikilinkClick }: { memory: Memory; onClose: () => void; onWikilinkClick?: (target: string) => void }) {
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
        <MemoryMetadataSection detail={detail} onWikilinkClick={onWikilinkClick} />
        <MemoryActionsSection {...memoryActions} />
      </Stack>
    </Modal>
  )
}
