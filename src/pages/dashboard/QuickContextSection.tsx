import { Loader, Stack, Text, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useState } from 'react'

import type { GatherContextResult } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { useContext } from '../../lib/queries'
import { ContextCard } from './ContextCard'

export function QuickContextSection() {
  const [task, setTask] = useState('')
  const [debouncedTask] = useDebouncedValue(task, 500)
  const contextQuery = useContext(debouncedTask)
  const data = contextQuery.data as GatherContextResult | undefined

  return (
    <SectionCard title='Quick Context'>
      <TextInput
        mb='sm'
        onChange={(e) => setTask(e.currentTarget.value)}
        placeholder='Describe a task to gather context for...'
        value={task}
      />
      {contextQuery.isLoading && debouncedTask && <Loader size='sm' />}
      {data && data.context.length > 0 && (
        <Stack gap='xs'>
          {data.context.map((entry) => (
            <ContextCard
              entry={entry}
              key={`${entry.source}-${entry.topic ?? ''}-${entry.symbol ?? ''}-${entry.content.slice(0, 32)}`}
            />
          ))}
          <Text
            c='dimmed'
            size='xs'
          >
            {data.tokens_used}/{data.tokens_budget} tokens | Sources: {data.sources_queried.join(', ')}
          </Text>
        </Stack>
      )}
      {data && data.context.length === 0 && debouncedTask && (
        <Text
          c='dimmed'
          size='sm'
        >
          No relevant context found.
        </Text>
      )}
    </SectionCard>
  )
}
