import { Button, Loader, Stack, Text } from '@mantine/core'
import { IconLink } from '@tabler/icons-react'

import type { SymbolLocation } from '../../lib/api'

interface SymbolReferencesPanelProps {
  onToggle: () => void
  references: SymbolLocation[]
  referencesLoading: boolean
  showReferences: boolean
}

export function SymbolReferencesPanel({ onToggle, references, referencesLoading, showReferences }: SymbolReferencesPanelProps) {
  return (
    <div>
      <Button
        disabled={referencesLoading}
        leftSection={<IconLink size={14} />}
        onClick={onToggle}
        size='xs'
        variant={showReferences ? 'filled' : 'light'}
      >
        {showReferences ? 'Hide' : 'Find'} References
      </Button>

      {showReferences && (
        <Stack
          gap='xs'
          mt='sm'
        >
          {referencesLoading && <Loader size='sm' />}
          {!referencesLoading && references.length === 0 && (
            <Text
              c='dimmed'
              size='xs'
            >
              No references found
            </Text>
          )}
          {!referencesLoading && references.length > 0 && (
            <Stack gap={0}>
              <Text
                c='dimmed'
                fw={500}
                size='xs'
              >
                References ({references.length})
              </Text>
              {references.map((ref) => (
                <Text
                  ff='monospace'
                  key={`${ref.file_path}-${ref.line_start}`}
                  size='xs'
                >
                  <Text
                    c='mycelium'
                    component='span'
                    ff='monospace'
                    fw={500}
                  >
                    {ref.file_path.split('/').pop()}
                  </Text>
                  :{ref.line_start}:{ref.column_start}
                </Text>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </div>
  )
}
