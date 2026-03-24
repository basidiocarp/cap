import type { UseMutationResult } from '@tanstack/react-query'
import { Alert, Stack, Text } from '@mantine/core'

import type { StipeRunResult } from '../lib/api'
import type { AllowedStipeAction } from '../lib/onboarding'
import { ErrorAlert } from './ErrorAlert'

export function StipeActionFeedback({
  mutation,
  showOutput = false,
}: {
  mutation: UseMutationResult<StipeRunResult, Error, AllowedStipeAction, unknown>
  showOutput?: boolean
}) {
  if (mutation.isError) {
    return (
      <ErrorAlert
        error={mutation.error}
        title='Stipe action failed'
      />
    )
  }

  if (!mutation.isSuccess) {
    return null
  }

  return (
    <Alert
      color='mycelium'
      title={`Ran ${mutation.data.action}`}
    >
      <Stack gap={4}>
        <Text size='sm'>{mutation.data.command}</Text>
        {showOutput && mutation.data.output && (
          <Text
            ff='monospace'
            size='xs'
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {mutation.data.output}
          </Text>
        )}
      </Stack>
    </Alert>
  )
}
