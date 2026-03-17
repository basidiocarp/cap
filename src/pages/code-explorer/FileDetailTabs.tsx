import { Alert, Badge, Group, Loader, Stack, Table, Tabs, Text } from '@mantine/core'

import type { Annotation, CallSite, ComplexityResult } from '../../lib/api'
import { CallGraph } from '../../components/CallGraph'
import { SectionCard } from '../../components/SectionCard'
import { annotationColor, complexityColor } from '../../lib/colors'

interface FileDetailTabsProps {
  annotations: Annotation[]
  annotationsLoading: boolean
  callSites: CallSite[]
  callSitesLoading: boolean
  complexity: ComplexityResult[]
  complexityLoading: boolean
  selectedFile: string | null
}

export function FileDetailTabs({
  annotations,
  annotationsLoading,
  callSites,
  callSitesLoading,
  complexity,
  complexityLoading,
  selectedFile,
}: FileDetailTabsProps) {
  return (
    <SectionCard>
      <Tabs defaultValue='annotations'>
        <Tabs.List>
          <Tabs.Tab value='annotations'>
            Annotations{' '}
            {!annotationsLoading && annotations.length > 0 && (
              <Badge
                ml={4}
                size='xs'
                variant='light'
              >
                {annotations.length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value='complexity'>
            Complexity{' '}
            {!complexityLoading && complexity.length > 0 && (
              <Badge
                ml={4}
                size='xs'
                variant='light'
              >
                {complexity.length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value='callSites'>
            Call Sites{' '}
            {!callSitesLoading && callSites.length > 0 && (
              <Badge
                color='spore'
                ml={4}
                size='xs'
                variant='light'
              >
                {callSites.length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value='dependencies'>Dependencies</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          pt='sm'
          value='annotations'
        >
          {annotationsLoading && <Loader size='sm' />}
          {!annotationsLoading && annotations.length === 0 && (
            <Text
              c='dimmed'
              size='sm'
            >
              No TODO, FIXME, or HACK comments found
            </Text>
          )}
          {!annotationsLoading && annotations.length > 0 && (
            <Stack gap='xs'>
              {annotations.map((a) => (
                <Alert
                  color={annotationColor(a.kind)}
                  key={`${a.kind}-${a.line}-${a.message}`}
                  p='xs'
                  variant='light'
                >
                  <Group gap='xs'>
                    <Badge
                      color={annotationColor(a.kind)}
                      size='xs'
                      variant='filled'
                    >
                      {a.kind}
                    </Badge>
                    <Text
                      c='dimmed'
                      ff='monospace'
                      size='xs'
                    >
                      L{a.line}
                    </Text>
                    <Text size='sm'>{a.message}</Text>
                  </Group>
                </Alert>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel
          pt='sm'
          value='complexity'
        >
          {complexityLoading && <Loader size='sm' />}
          {!complexityLoading && complexity.length === 0 && (
            <Text
              c='dimmed'
              size='sm'
            >
              No complexity data available
            </Text>
          )}
          {!complexityLoading && complexity.length > 0 && (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Function</Table.Th>
                  <Table.Th>Line</Table.Th>
                  <Table.Th>Complexity</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {complexity.map((c) => (
                  <Table.Tr key={`${c.name}-${c.line}`}>
                    <Table.Td>
                      <Text
                        ff='monospace'
                        size='sm'
                      >
                        {c.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>{c.line}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={complexityColor(c.complexity)}
                        size='sm'
                        variant='light'
                      >
                        {c.complexity}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel
          pt='sm'
          value='callSites'
        >
          {callSitesLoading && <Loader size='sm' />}
          {!callSitesLoading && callSites.length === 0 && (
            <Text
              c='dimmed'
              size='sm'
            >
              No call sites found
            </Text>
          )}
          {!callSitesLoading && callSites.length > 0 && (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Caller</Table.Th>
                  <Table.Th>Line</Table.Th>
                  <Table.Th>Call Expression</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {callSites.map((cs) => (
                  <Table.Tr key={`${cs.caller}-${cs.line}-${cs.call_expression}`}>
                    <Table.Td>
                      <Text
                        ff='monospace'
                        size='sm'
                      >
                        {cs.caller}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm'>{cs.line}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        ff='monospace'
                        lineClamp={1}
                        size='xs'
                      >
                        {cs.call_expression}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel
          pt='sm'
          value='dependencies'
        >
          <CallGraph file={selectedFile} />
        </Tabs.Panel>
      </Tabs>
    </SectionCard>
  )
}
