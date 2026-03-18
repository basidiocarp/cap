import { ActionIcon, Alert, Badge, Group, Loader, Stack, Table, Text, TextInput, Title, Tooltip } from '@mantine/core'
import { IconCheck, IconDownload, IconSearch, IconX } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import type { LspLanguageStatus } from '../../lib/types/settings'
import { SectionCard } from '../../components/SectionCard'
import { useLspInstall, useLspStatus } from '../../lib/queries'

function StatusBadge({ status }: { status: LspLanguageStatus }) {
  if (status.lsp_available) {
    return (
      <Tooltip label={status.lsp_path ?? 'Available'}>
        <Badge
          color='mycelium'
          leftSection={<IconCheck size={12} />}
          size='sm'
          variant='light'
        >
          Installed
        </Badge>
      </Tooltip>
    )
  }
  return (
    <Badge
      color='gray'
      leftSection={<IconX size={12} />}
      size='sm'
      variant='light'
    >
      Not found
    </Badge>
  )
}

function InstallButton({ language, onInstall, installing }: { installing: string | null; language: string; onInstall: (lang: string) => void }) {
  const isInstalling = installing === language

  return (
    <Tooltip label={`Install LSP for ${language}`}>
      <ActionIcon
        color='mycelium'
        loading={isInstalling}
        onClick={() => onInstall(language)}
        size='sm'
        variant='subtle'
      >
        <IconDownload size={14} />
      </ActionIcon>
    </Tooltip>
  )
}

export function LspManager() {
  const { data, isLoading } = useLspStatus()
  const install = useLspInstall()
  const [filter, setFilter] = useState('')
  const [installing, setInstalling] = useState<string | null>(null)

  const handleInstall = (language: string) => {
    setInstalling(language)
    install.mutate(language, {
      onSettled: () => setInstalling(null),
    })
  }

  const languages = useMemo(() => {
    if (!data?.languages) return []
    if (!filter.trim()) return data.languages
    const q = filter.toLowerCase()
    return data.languages.filter(
      (l) => l.language.toLowerCase().includes(q) || l.lsp_binary.toLowerCase().includes(q)
    )
  }, [data, filter])

  const installedCount = data?.languages.filter((l) => l.lsp_available).length ?? 0
  const totalCount = data?.languages.length ?? 0

  if (isLoading) {
    return (
      <SectionCard>
        <Group>
          <Loader size='sm' />
          <Text size='sm'>Loading LSP status...</Text>
        </Group>
      </SectionCard>
    )
  }

  if (!data?.available) {
    return (
      <Alert
        color='yellow'
        title='Rhizome Not Available'
      >
        Rhizome must be installed and running to manage LSP servers. Run{' '}
        <Text
          component='code'
          size='sm'
        >
          rhizome lsp status
        </Text>{' '}
        to check.
      </Alert>
    )
  }

  return (
    <Stack>
      <Group justify='space-between'>
        <Title order={4}>Language Server Management</Title>
        <Badge
          color='mycelium'
          size='lg'
          variant='light'
        >
          {installedCount} / {totalCount} installed
        </Badge>
      </Group>

      {install.isSuccess && (
        <Alert
          color={install.data.installed ? 'mycelium' : 'yellow'}
          title={install.data.installed ? 'Installed' : 'Install skipped'}
        >
          {install.data.message}
        </Alert>
      )}

      {install.isError && (
        <Alert
          color='red'
          title='Install failed'
        >
          {install.error instanceof Error ? install.error.message : 'Unknown error'}
        </Alert>
      )}

      <TextInput
        leftSection={<IconSearch size={16} />}
        onChange={(e) => setFilter(e.currentTarget.value)}
        placeholder='Filter languages...'
        value={filter}
      />

      <Table
        highlightOnHover
        striped
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Language</Table.Th>
            <Table.Th>LSP Server</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th w={60}>Action</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {languages.map((lang) => (
            <Table.Tr key={lang.language}>
              <Table.Td>
                <Text
                  fw={500}
                  size='sm'
                >
                  {lang.language}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text
                  c='dimmed'
                  ff='monospace'
                  size='sm'
                >
                  {lang.lsp_binary}
                </Text>
              </Table.Td>
              <Table.Td>
                <StatusBadge status={lang} />
              </Table.Td>
              <Table.Td>
                {!lang.lsp_available && (
                  <InstallButton
                    installing={installing}
                    language={lang.language.toLowerCase()}
                    onInstall={handleInstall}
                  />
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
