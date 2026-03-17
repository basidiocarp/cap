import type { ErrorInfo, ReactNode } from 'react'
import { Alert, Button, Stack, Text } from '@mantine/core'
import { Component } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <Stack
          align='center'
          mt='xl'
          p='xl'
        >
          <Alert
            color='decay'
            title='Something went wrong'
          >
            <Text size='sm'>{this.state.error.message}</Text>
          </Alert>
          <Button
            onClick={() => this.setState({ error: null })}
            variant='light'
          >
            Try again
          </Button>
        </Stack>
      )
    }
    return this.props.children
  }
}
