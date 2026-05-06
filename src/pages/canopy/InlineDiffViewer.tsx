import { Badge, Box, Code, Group, Stack, Text } from '@mantine/core'
import { useState } from 'react'

import type { DiffHunk, DiffLine, ParsedDiff } from '../../lib/diff-parser'
import type { ReviewAnnotation } from '../../store/annotations'
import { hashLines } from '../../lib/diff-parser'
import { DiffAnnotationPanel } from './DiffAnnotationPanel'

interface Props {
  diff: ParsedDiff
  onAnnotate: (annotation: Omit<ReviewAnnotation, 'id' | 'createdAt' | 'taskId'>) => void
  taskAnnotations: ReviewAnnotation[]
}

interface SelectedLine {
  hunkIdx: number
  lineIdx: number
  line: DiffLine
}

function lineColor(type: DiffLine['type']): string {
  if (type === 'add') return 'var(--mantine-color-green-9)'
  if (type === 'remove') return 'var(--mantine-color-red-9)'
  return 'transparent'
}

function annotationBadgeColor(action: ReviewAnnotation['action']): string {
  if (action === 'approve') return 'teal'
  if (action === 'reject') return 'red'
  return 'orange'
}

function findAnnotationsForLine(annotations: ReviewAnnotation[], lineNo: number | null): ReviewAnnotation[] {
  if (lineNo === null) return []
  return annotations.filter((a) => lineNo >= a.startLine && lineNo <= a.endLine)
}

function HunkView({
  annotations,
  hunk,
  hunkIdx,
  onLineClick,
  selectedLine,
}: {
  annotations: ReviewAnnotation[]
  hunk: DiffHunk
  hunkIdx: number
  onLineClick: (sel: SelectedLine | null) => void
  selectedLine: SelectedLine | null
}) {
  return (
    <Box>
      <Text
        bg='var(--mantine-color-dark-6)'
        c='dimmed'
        ff='monospace'
        px='xs'
        size='xs'
      >
        {hunk.header}
      </Text>
      {hunk.lines.map((line, lineIdx) => {
        const lineNo = line.newLineNo ?? line.oldLineNo
        const lineAnnotations = findAnnotationsForLine(annotations, lineNo)
        const isSelected = selectedLine?.hunkIdx === hunkIdx && selectedLine?.lineIdx === lineIdx

        return (
          <Box key={lineIdx}>
            <Group
              bg={isSelected ? 'var(--mantine-color-dark-5)' : lineColor(line.type)}
              gap={0}
              onClick={() => onLineClick(isSelected ? null : { hunkIdx, line, lineIdx })}
              px='xs'
              py={1}
              style={{ cursor: 'pointer' }}
              wrap='nowrap'
            >
              <Text
                c='dimmed'
                ff='monospace'
                size='xs'
                w={40}
              >
                {line.oldLineNo ?? ''}
              </Text>
              <Text
                c='dimmed'
                ff='monospace'
                size='xs'
                w={40}
              >
                {line.newLineNo ?? ''}
              </Text>
              <Text
                c={line.type === 'add' ? 'green' : line.type === 'remove' ? 'red' : undefined}
                ff='monospace'
                size='xs'
                style={{ flex: 1, userSelect: 'text' }}
              >
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                {line.content}
              </Text>
              {lineAnnotations.map((ann) => (
                <Badge
                  color={annotationBadgeColor(ann.action)}
                  key={ann.id}
                  ml='xs'
                  size='xs'
                  variant='light'
                >
                  {ann.action}
                </Badge>
              ))}
            </Group>
            {lineAnnotations.map((ann) => (
              <Box
                bg='var(--mantine-color-dark-7)'
                key={ann.id}
                px='xs'
                py={4}
              >
                <Text
                  c='dimmed'
                  size='xs'
                >
                  <Badge
                    color={annotationBadgeColor(ann.action)}
                    mr='xs'
                    size='xs'
                    variant='light'
                  >
                    {ann.action}
                  </Badge>
                  {ann.comment}
                </Text>
              </Box>
            ))}
          </Box>
        )
      })}
    </Box>
  )
}

export function InlineDiffViewer({ diff, onAnnotate, taskAnnotations }: Props) {
  const [selectedLine, setSelectedLine] = useState<SelectedLine | null>(null)

  const handleAnnotate = (annotation: Omit<ReviewAnnotation, 'id' | 'createdAt' | 'taskId'>) => {
    onAnnotate(annotation)
    setSelectedLine(null)
  }

  return (
    <Stack gap='xs'>
      <Code block>{diff.filePath}</Code>
      {diff.hunks.map((hunk, hunkIdx) => (
        <Box key={hunkIdx}>
          <HunkView
            annotations={taskAnnotations.filter((a) => a.filePath === diff.filePath)}
            hunk={hunk}
            hunkIdx={hunkIdx}
            onLineClick={setSelectedLine}
            selectedLine={selectedLine}
          />
          {selectedLine?.hunkIdx === hunkIdx ? (
            <Box pt='xs'>
              <DiffAnnotationPanel
                anchorHash={hashLines([selectedLine.line.content])}
                endLine={selectedLine.line.newLineNo ?? selectedLine.line.oldLineNo ?? 0}
                filePath={diff.filePath}
                lineContent={selectedLine.line.content}
                onCancel={() => setSelectedLine(null)}
                onSubmit={handleAnnotate}
                startLine={selectedLine.line.newLineNo ?? selectedLine.line.oldLineNo ?? 0}
              />
            </Box>
          ) : null}
        </Box>
      ))}
    </Stack>
  )
}
