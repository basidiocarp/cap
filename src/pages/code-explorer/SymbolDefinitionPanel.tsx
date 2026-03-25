import { Code, Stack, Text, UnstyledButton } from '@mantine/core'

import type { SymbolDefinition } from '../../lib/api'

interface SymbolDefinitionPanelProps {
  defPreview: string
  definition: SymbolDefinition
  hasMoreLines: boolean
  onToggleFullDef: () => void
  showFullDef: boolean
}

export function SymbolDefinitionPanel({ defPreview, definition, hasMoreLines, onToggleFullDef, showFullDef }: SymbolDefinitionPanelProps) {
  return (
    <Stack gap='md'>
      {definition.doc_comment && (
        <Text
          c='dimmed'
          size='xs'
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {definition.doc_comment}
        </Text>
      )}
      <Code
        block
        id='symbol-definition-body'
      >
        {showFullDef ? definition.body : defPreview}
      </Code>
      {hasMoreLines && (
        <UnstyledButton
          aria-controls='symbol-definition-body'
          aria-expanded={showFullDef}
          onClick={onToggleFullDef}
        >
          <Text
            c='mycelium'
            size='xs'
          >
            {showFullDef ? 'Show preview' : 'View full definition'}
          </Text>
        </UnstyledButton>
      )}
    </Stack>
  )
}
