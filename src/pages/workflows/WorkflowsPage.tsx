import { Box, Grid, Loader, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'

import { PageLoader } from '../../components/PageLoader'
import { WorkflowDAGView } from '../../components/WorkflowDAGView'
import { useWorkflowDetail, useWorkflowRuns, useWorkflowsList } from '../../lib/queries'

export function WorkflowsPage() {
  const workflowsQuery = useWorkflowsList()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const workflowYamlQuery = useWorkflowDetail(selectedId || '')
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const runsQuery = useWorkflowRuns({ refetchInterval })

  // Auto-select first workflow if none selected
  useEffect(() => {
    if (workflowsQuery.data && workflowsQuery.data.length > 0 && !selectedId) {
      setSelectedId(workflowsQuery.data[0].workflow_id)
    }
  }, [workflowsQuery.data, selectedId])

  // Enable polling when there's an active run
  useEffect(() => {
    const hasActiveRun = runsQuery.data?.some((run) => run.status === 'running')
    setRefetchInterval(hasActiveRun ? 3000 : false)
  }, [runsQuery.data])

  const selectedWorkflow = workflowsQuery.data?.find((w) => w.workflow_id === selectedId)
  const activeRun = runsQuery.data?.find((r) => r.workflow_id === selectedId)

  if (workflowsQuery.isLoading) {
    return <PageLoader mt='xl' />
  }

  return (
    <Stack gap='lg'>
      <div>
        <Title order={2}>Workflows</Title>
        <Text c='dimmed'>Browse and monitor workflow definitions and executions</Text>
      </div>

      <Grid gutter='lg'>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper
            p='md'
            radius='md'
            withBorder
          >
            <Stack gap='md'>
              <div>
                <Text
                  fw={600}
                  mb='xs'
                  size='sm'
                >
                  Available Workflows
                </Text>
                {workflowsQuery.data && workflowsQuery.data.length === 0 ? (
                  <Text c='dimmed'>No workflows found</Text>
                ) : (
                  <ScrollArea>
                    <Stack gap='xs'>
                      {workflowsQuery.data?.map((workflow) => (
                        <Paper
                          key={workflow.workflow_id}
                          onClick={() => setSelectedId(workflow.workflow_id)}
                          p='sm'
                          radius='md'
                          style={{
                            backgroundColor: selectedId === workflow.workflow_id ? 'var(--mantine-color-blue-0)' : undefined,
                            border:
                              selectedId === workflow.workflow_id
                                ? '1px solid var(--mantine-color-blue-3)'
                                : '1px solid var(--mantine-color-gray-3)',
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                          }}
                          withBorder
                        >
                          <Stack gap={0}>
                            <Text
                              fw={selectedId === workflow.workflow_id ? 600 : 500}
                              size='sm'
                            >
                              {workflow.name}
                            </Text>
                            {workflow.description && (
                              <Text
                                c='dimmed'
                                size='xs'
                              >
                                {workflow.description}
                              </Text>
                            )}
                            <Text
                              c='dimmed'
                              size='xs'
                            >
                              {workflow.node_count} nodes
                            </Text>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea>
                )}
              </div>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          {!selectedWorkflow ? (
            <Paper
              p='xl'
              radius='md'
              style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '400px' }}
              withBorder
            >
              <Text c='dimmed'>Select a workflow to preview</Text>
            </Paper>
          ) : (
            <Stack gap='md'>
              <Paper
                p='md'
                radius='md'
                withBorder
              >
                <Stack gap='xs'>
                  <div>
                    <Text
                      fw={600}
                      size='sm'
                    >
                      {selectedWorkflow.name}
                    </Text>
                    {selectedWorkflow.description && (
                      <Text
                        c='dimmed'
                        size='sm'
                      >
                        {selectedWorkflow.description}
                      </Text>
                    )}
                  </div>
                </Stack>
              </Paper>

              <Paper
                radius='md'
                withBorder
              >
                <Box>
                  {workflowYamlQuery.isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <Loader size='sm' />
                    </div>
                  ) : workflowYamlQuery.data ? (
                    <WorkflowDAGView
                      activeRun={activeRun}
                      yaml={workflowYamlQuery.data}
                    />
                  ) : (
                    <div style={{ padding: '2rem' }}>
                      <Text c='dimmed'>Failed to load workflow</Text>
                    </div>
                  )}
                </Box>
              </Paper>

              {activeRun && (
                <Paper
                  p='md'
                  radius='md'
                  withBorder
                >
                  <Stack gap='xs'>
                    <Text
                      fw={600}
                      size='sm'
                    >
                      Active Run: {activeRun.run_id}
                    </Text>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      Status: {activeRun.status}
                    </Text>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      Started: {new Date(activeRun.started_at).toLocaleString()}
                    </Text>
                  </Stack>
                </Paper>
              )}
            </Stack>
          )}
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
