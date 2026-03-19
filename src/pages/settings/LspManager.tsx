import {
  ActionIcon,
  Alert,
  Badge,
  Group,
  Loader,
  Progress,
  ScrollArea,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconCheck, IconDownload, IconSearch, IconX } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { SectionCard } from '../../components/SectionCard'
import { useLspInstall, useLspStatus } from '../../lib/queries'

function StatusBadge({ available, label }: { available: boolean; label?: string }) {
  if (available) {
    return (
      <Tooltip label={label ?? 'Available'}>
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

export function LspManager() {
  const { data, isLoading } = useLspStatus()
  const install = useLspInstall()
  const [filter, setFilter] = useState('')
  const [installing, setInstalling] = useState<string | null>(null)
  const [view, setView] = useState<'all' | 'installed' | 'missing'>('all')

  const handleInstall = (language: string) => {
    setInstalling(language)
    install.mutate(language, {
      onSettled: () => setInstalling(null),
    })
  }

  const languages = useMemo(() => {
    if (!data?.languages) return []
    let filtered = data.languages

    if (view === 'installed') {
      filtered = filtered.filter((l) => l.lsp_available)
    } else if (view === 'missing') {
      filtered = filtered.filter((l) => !l.lsp_available)
    }

    if (filter.trim()) {
      const q = filter.toLowerCase()
      filtered = filtered.filter((l) => l.language.toLowerCase().includes(q) || l.lsp_binary.toLowerCase().includes(q))
    }

    return filtered
  }, [data, filter, view])

  const installedCount = data?.languages.filter((l) => l.lsp_available).length ?? 0
  const totalCount = data?.languages.length ?? 0
  const treeSitterCount = data?.languages.filter((l) => l.tree_sitter).length ?? 0

  if (isLoading) {
    return (
      <SectionCard>
        <Group>
          <Loader size='sm' />
          <Text size='sm'>Loading LSP status from Rhizome...</Text>
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
        Rhizome must be installed to manage language servers. Install it with:{' '}
        <Text
          component='code'
          size='sm'
        >
          cargo install --git https://github.com/basidiocarp/rhizome rhizome-cli
        </Text>
      </Alert>
    )
  }

  return (
    <Stack>
      <Group justify='space-between'>
        <Title order={4}>Language Servers</Title>
        <Group gap='sm'>
          <Tooltip label={`${treeSitterCount} with tree-sitter parsing`}>
            <Badge
              color='lichen'
              size='lg'
              variant='light'
            >
              {treeSitterCount} tree-sitter
            </Badge>
          </Tooltip>
          <Badge
            color='mycelium'
            size='lg'
            variant='light'
          >
            {installedCount} / {totalCount} LSP
          </Badge>
        </Group>
      </Group>

      <Tooltip label={`${installedCount} of ${totalCount} language servers installed`}>
        <Progress
          color='mycelium'
          size='lg'
          value={totalCount > 0 ? (installedCount / totalCount) * 100 : 0}
        />
      </Tooltip>

      {install.isSuccess && (
        <Alert
          color={install.data.installed ? 'mycelium' : 'yellow'}
          title={install.data.installed ? 'Installed successfully' : 'Install skipped'}
          withCloseButton
        >
          {install.data.message}
        </Alert>
      )}

      {install.isError && (
        <Alert
          color='red'
          title='Install failed'
          withCloseButton
        >
          {install.error instanceof Error ? install.error.message : 'Unknown error'}
        </Alert>
      )}

      <Group>
        <TextInput
          leftSection={<IconSearch size={16} />}
          onChange={(e) => setFilter(e.currentTarget.value)}
          placeholder='Filter languages...'
          style={{ flex: 1 }}
          value={filter}
        />
        <SegmentedControl
          data={[
            { label: `All (${totalCount})`, value: 'all' },
            { label: `Installed (${installedCount})`, value: 'installed' },
            { label: `Missing (${totalCount - installedCount})`, value: 'missing' },
          ]}
          onChange={(v) => setView(v as 'all' | 'installed' | 'missing')}
          size='xs'
          value={view}
        />
      </Group>

      <SectionCard>
        <ScrollArea>
          <Table
            highlightOnHover
            striped
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Language</Table.Th>
                <Table.Th>LSP Server</Table.Th>
                <Table.Th w={90}>Tree-sitter</Table.Th>
                <Table.Th w={100}>LSP Status</Table.Th>
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
                    <StatusBadge
                      available={lang.tree_sitter}
                      label='Tree-sitter parsing available offline'
                    />
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge
                      available={lang.lsp_available}
                      label={lang.lsp_path ?? undefined}
                    />
                  </Table.Td>
                  <Table.Td>
                    {!lang.lsp_available && (
                      <Tooltip label={`Install ${lang.lsp_binary}`}>
                        <ActionIcon
                          color='mycelium'
                          loading={installing === lang.language.toLowerCase()}
                          onClick={() => handleInstall(lang.language.toLowerCase())}
                          size='sm'
                          variant='subtle'
                        >
                          <IconDownload size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
              {languages.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text
                      c='dimmed'
                      py='md'
                      size='sm'
                      ta='center'
                    >
                      No languages match your filter
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </SectionCard>
    </Stack>
  )
}
