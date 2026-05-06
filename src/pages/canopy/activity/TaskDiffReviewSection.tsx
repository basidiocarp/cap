import { Alert, Badge, Button, Divider, Group, Loader, Stack, Text, TextInput } from '@mantine/core'
import { useState } from 'react'

import type { ParsedDiff } from '../../../lib/diff-parser'
import type { ReviewAnnotation } from '../../../store/annotations'
import { diffApi } from '../../../lib/api'
import { parseDiff } from '../../../lib/diff-parser'
import { useAnnotationStore } from '../../../store/annotations'
import { InlineDiffViewer } from '../InlineDiffViewer'

export function TaskDiffReviewSection({ taskId }: { taskId: string }) {
  const [file, setFile] = useState('')
  const [base, setBase] = useState('HEAD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedDiffs, setParsedDiffs] = useState<ParsedDiff[]>([])

  const addAnnotation = useAnnotationStore((s) => s.addAnnotation)
  const getTaskAnnotations = useAnnotationStore((s) => s.getTaskAnnotations)
  const taskAnnotations = getTaskAnnotations(taskId)

  const loadDiff = async () => {
    if (!file.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await diffApi.getFileDiff(file.trim(), base.trim() || 'HEAD')
      setParsedDiffs(parseDiff(result.diff))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load diff')
    } finally {
      setLoading(false)
    }
  }

  const handleAnnotate = (annotation: Omit<ReviewAnnotation, 'id' | 'createdAt' | 'taskId'>) => {
    addAnnotation({
      ...annotation,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      taskId,
    })
  }

  return (
    <>
      <Divider label='Diff Review' />
      <Stack gap='xs'>
        <Group
          align='flex-end'
          gap='xs'
          wrap='nowrap'
        >
          <TextInput
            flex={1}
            label='File path'
            onChange={(e) => setFile(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void loadDiff() }}
            placeholder='src/main.rs'
            size='xs'
            value={file}
          />
          <TextInput
            label='Base ref'
            onChange={(e) => setBase(e.currentTarget.value)}
            size='xs'
            value={base}
            w={100}
          />
          <Button
            disabled={!file.trim() || loading}
            loading={loading}
            onClick={() => void loadDiff()}
            size='xs'
          >
            Load diff
          </Button>
        </Group>

        {error ? (
          <Alert
            color='red'
            title='Error'
          >
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Group gap='xs'>
            <Loader size='xs' />
            <Text
              c='dimmed'
              size='xs'
            >
              Loading diff…
            </Text>
          </Group>
        ) : null}

        {!loading && parsedDiffs.length === 0 && !error && file && (
          <Text
            c='dimmed'
            size='xs'
          >
            No diff to display. The file may be unchanged relative to {base || 'HEAD'}.
          </Text>
        )}

        {parsedDiffs.map((diff) => (
          <InlineDiffViewer
            diff={diff}
            key={diff.filePath}
            onAnnotate={handleAnnotate}
            taskAnnotations={taskAnnotations}
          />
        ))}

        {taskAnnotations.length > 0 ? (
          <>
            <Divider
              label={`Annotations (${taskAnnotations.length})`}
              labelPosition='left'
            />
            <Stack gap={4}>
              {taskAnnotations.map((ann) => (
                <Group
                  gap='xs'
                  key={ann.id}
                  wrap='nowrap'
                >
                  <Badge
                    color={ann.action === 'approve' ? 'teal' : ann.action === 'reject' ? 'red' : 'orange'}
                    size='xs'
                    variant='light'
                  >
                    {ann.action}
                  </Badge>
                  <Text
                    c='dimmed'
                    ff='monospace'
                    size='xs'
                    truncate
                  >
                    {ann.filePath}:{ann.startLine}
                  </Text>
                  {ann.comment ? (
                    <Text
                      size='xs'
                      style={{ flex: 1 }}
                    >
                      {ann.comment}
                    </Text>
                  ) : null}
                </Group>
              ))}
            </Stack>
          </>
        ) : null}
      </Stack>
    </>
  )
}
