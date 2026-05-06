import { Button, Card, Group, Select, Stack, Text, Textarea } from '@mantine/core'
import { useState } from 'react'

import type { ReviewAnnotation } from '../../store/annotations'

interface Props {
  anchorHash: string
  endLine: number
  filePath: string
  lineContent: string
  onCancel: () => void
  onSubmit: (annotation: Omit<ReviewAnnotation, 'id' | 'createdAt' | 'taskId'>) => void
  startLine: number
}

const ACTION_OPTIONS = [
  { label: 'Approve', value: 'approve' },
  { label: 'Reject', value: 'reject' },
  { label: 'Revise', value: 'revise' },
]

export function DiffAnnotationPanel({ anchorHash, endLine, filePath, lineContent, onCancel, onSubmit, startLine }: Props) {
  const [action, setAction] = useState<ReviewAnnotation['action']>('revise')
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    onSubmit({ action, anchorHash, comment, endLine, filePath, startLine })
    setComment('')
  }

  return (
    <Card
      bg='var(--mantine-color-dark-7)'
      p='sm'
      radius='sm'
      withBorder
    >
      <Stack gap='xs'>
        <Text
          c='dimmed'
          ff='monospace'
          size='xs'
          truncate
        >
          {filePath}:{startLine}{startLine !== endLine ? `–${endLine}` : ''}
        </Text>
        <Text
          c='dimmed'
          ff='monospace'
          size='xs'
          truncate
        >
          {lineContent}
        </Text>
        <Group align='end'>
          <Select
            data={ACTION_OPTIONS}
            label='Action'
            onChange={(v) => { if (v) setAction(v as ReviewAnnotation['action']) }}
            size='xs'
            value={action}
            w={120}
          />
        </Group>
        <Textarea
          autosize
          label='Comment'
          minRows={2}
          onChange={(e) => setComment(e.currentTarget.value)}
          placeholder={action === 'approve' ? 'Optional approval note' : 'Describe what needs to change'}
          size='xs'
          value={comment}
        />
        <Group gap='xs' justify='flex-end'>
          <Button onClick={onCancel} size='xs' variant='subtle'>Cancel</Button>
          <Button
            color={action === 'approve' ? 'teal' : action === 'reject' ? 'red' : 'orange'}
            disabled={action !== 'approve' && !comment.trim()}
            onClick={handleSubmit}
            size='xs'
          >
            {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Request revision'}
          </Button>
        </Group>
      </Stack>
    </Card>
  )
}
