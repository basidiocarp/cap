import { Alert, List, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

export function DiagnosticsUnavailableAlert() {
  return (
    <Alert
      color='substrate'
      title='Language Server Required'
    >
      <Text size='sm'>
        Diagnostics (errors, warnings, type issues) require a running language server. Tree-sitter provides symbol extraction only it cannot
        type-check code.
      </Text>
      <Text
        mt='xs'
        size='sm'
      >
        To enable diagnostics:
      </Text>
      <List
        mt='xs'
        size='sm'
      >
        <List.Item>
          Go to{' '}
          <Text
            c='mycelium'
            component={Link}
            to='/settings'
          >
            Settings → Language Servers
          </Text>{' '}
          and install an LSP server for your language
        </List.Item>
        <List.Item>Rhizome will auto-upgrade to the LSP backend when a server is available</List.Item>
      </List>
    </Alert>
  )
}
