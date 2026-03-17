import type { ReactNode } from 'react'
import { Table } from '@mantine/core'

import { onActivate } from '../lib/keyboard'

export interface ColumnDef<T> {
  header: string
  key: string
  render: (row: T) => ReactNode
  width?: number
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  highlightOnHover?: boolean
  onRowClick?: (row: T) => void
  rowKey: (row: T) => string
  striped?: boolean
}

export function DataTable<T>({ columns, data, highlightOnHover, onRowClick, rowKey, striped }: DataTableProps<T>) {
  return (
    <Table
      highlightOnHover={highlightOnHover ?? !!onRowClick}
      striped={striped}
    >
      <Table.Thead>
        <Table.Tr>
          {columns.map((col) => (
            <Table.Th
              key={col.key}
              w={col.width}
            >
              {col.header}
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.map((row) => (
          <Table.Tr
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={onRowClick ? onActivate(() => onRowClick(row)) : undefined}
            style={onRowClick ? { cursor: 'pointer' } : undefined}
            tabIndex={onRowClick ? 0 : undefined}
          >
            {columns.map((col) => (
              <Table.Td key={col.key}>{col.render(row)}</Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
