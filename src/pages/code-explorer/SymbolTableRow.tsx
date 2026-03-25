import { Badge, Group, Table, Text } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'

import type { RhizomeSymbol } from '../../lib/api'
import { symbolKindColor } from '../../lib/colors'
import { onActivate } from '../../lib/keyboard'

interface SymbolTableRowProps {
  expanded: boolean
  onToggle: () => void
  symbol: RhizomeSymbol
}

export function SymbolTableRow({ expanded, onToggle, symbol }: SymbolTableRowProps) {
  return (
    <Table.Tr
      aria-expanded={expanded}
      aria-selected={expanded}
      onClick={onToggle}
      onKeyDown={onActivate(onToggle)}
      style={{ cursor: 'pointer' }}
      tabIndex={0}
    >
      <Table.Td>
        <Group gap='xs'>
          <IconChevronRight
            size={14}
            style={{
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 150ms',
            }}
          />
          <Text
            fw={500}
            size='sm'
          >
            {symbol.name}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge
          color={symbolKindColor(symbol.kind)}
          size='sm'
          variant='light'
        >
          {symbol.kind}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size='sm'>{symbol.location.line_start}</Text>
      </Table.Td>
      <Table.Td maw={300}>
        {symbol.signature ? (
          <Text
            ff='monospace'
            lineClamp={1}
            size='xs'
          >
            {symbol.signature}
          </Text>
        ) : (
          <Text
            c='dimmed'
            size='xs'
          >
            —
          </Text>
        )}
      </Table.Td>
    </Table.Tr>
  )
}
