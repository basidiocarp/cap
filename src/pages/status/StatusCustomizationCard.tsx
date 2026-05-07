import { Badge, Stack, Table, Text } from '@mantine/core'

import type { StatusSegment } from '../../lib/types'
import { useStatusCustomization } from '../../lib/queries/annulus'
import { SectionCard } from '../../components/SectionCard'

export function StatusCustomizationCard() {
  const { data: customization } = useStatusCustomization()

  if (!customization) {
    return null
  }

  return (
    <SectionCard title='Status preview & customization'>
      <Stack gap='md'>
        <div>
          <Text
            fw={500}
            mb='xs'
            size='sm'
          >
            Segments
          </Text>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {customization.segments.map((segment: StatusSegment) => (
                <Table.Tr key={segment.id}>
                  <Table.Td>
                    <Text size='sm'>{segment.id}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={segment.enabled ? 'teal' : 'red'}
                      size='sm'
                      variant='light'
                    >
                      {segment.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        <div>
          <Text
            fw={500}
            mb='xs'
            size='sm'
          >
            Theme
          </Text>
          <Stack gap='xs'>
            <div>
              <Text
                c='dimmed'
                size='sm'
              >
                Color mode: <strong>{customization.theme.color_mode}</strong>
              </Text>
              <Text
                c='dimmed'
                size='sm'
              >
                Separator: <strong>{JSON.stringify(customization.theme.separator)}</strong>
              </Text>
            </div>
          </Stack>
        </div>

        <Text
          c='dimmed'
          size='xs'
        >
          Resolved status customization from annulus config export (septa: resolved-status-customization-v1)
        </Text>
      </Stack>
    </SectionCard>
  )
}
