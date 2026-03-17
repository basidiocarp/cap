import { Alert } from '@mantine/core'

export function ErrorAlert({
  error,
  onClose,
  title = 'Error',
  withCloseButton,
}: {
  error: Error | string | null | undefined
  onClose?: () => void
  title?: string
  withCloseButton?: boolean
}) {
  if (!error) return null
  const message = error instanceof Error ? error.message : error
  return (
    <Alert
      color='decay'
      onClose={onClose}
      title={title}
      withCloseButton={withCloseButton}
    >
      {message}
    </Alert>
  )
}
