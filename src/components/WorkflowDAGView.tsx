import { Stack, Text } from '@mantine/core'

import type { WorkflowRunStatus } from '../lib/types/workflows'
import { WorkflowNodeCard } from './WorkflowNodeCard'

interface WorkflowDAGViewProps {
  yaml: string
  activeRun?: WorkflowRunStatus
}

interface Node {
  id: string
  kind: string
}

function parseWorkflowYaml(yaml: string): Node[] {
  const nodes: Node[] = []
  const lines = yaml.split('\n')

  let currentNode: Partial<Node> | null = null
  let inNodeList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Detect start of nodes section (looking for '- id:' or '- kind:')
    if ((trimmed.startsWith('- id:') || trimmed.startsWith('- kind:')) && !inNodeList) {
      inNodeList = true
    }

    if (inNodeList) {
      // End of nodes section when we hit something at root level without leading dash
      if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('-')) {
        inNodeList = false
        if (currentNode?.id && currentNode?.kind) {
          nodes.push({ id: currentNode.id, kind: currentNode.kind })
        }
        currentNode = null
      }

      // Parse node attributes
      if (trimmed.startsWith('- ')) {
        // New node item
        if (currentNode?.id && currentNode?.kind) {
          nodes.push({ id: currentNode.id, kind: currentNode.kind })
        }
        currentNode = {}

        if (trimmed.includes('id:')) {
          const match = /id:\s*['"]?([^'"]+)['"]?/.exec(trimmed)
          if (match) currentNode.id = match[1].trim()
        } else if (trimmed.includes('kind:')) {
          const match = /kind:\s*['"]?([^'"]+)['"]?/.exec(trimmed)
          if (match) currentNode.kind = match[1].trim()
        }
      } else if (trimmed.startsWith('id:')) {
        const match = /id:\s*['"]?([^'"]+)['"]?/.exec(trimmed)
        if (match && currentNode) currentNode.id = match[1].trim()
      } else if (trimmed.startsWith('kind:')) {
        const match = /kind:\s*['"]?([^'"]+)['"]?/.exec(trimmed)
        if (match && currentNode) currentNode.kind = match[1].trim()
      }
    }
  }

  // Don't forget last node
  if (currentNode?.id && currentNode?.kind) {
    nodes.push({ id: currentNode.id, kind: currentNode.kind })
  }

  return nodes
}

export function WorkflowDAGView({ yaml, activeRun }: WorkflowDAGViewProps) {
  const nodes = parseWorkflowYaml(yaml)

  if (nodes.length === 0) {
    return (
      <Stack
        align='center'
        justify='center'
        p='lg'
      >
        <Text c='dimmed'>No nodes found in workflow</Text>
      </Stack>
    )
  }

  // Map node_id to status for quick lookup
  const statusMap = new Map(activeRun?.nodes?.map((n) => [n.node_id, n]) || [])

  return (
    <Stack
      gap='md'
      p='md'
    >
      {nodes.map((node, idx) => (
        <div key={node.id}>
          <WorkflowNodeCard
            kind={node.kind}
            nodeId={node.id}
            status={statusMap.get(node.id)}
          />
          {idx < nodes.length - 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  borderLeft: '2px solid var(--mantine-color-gray-4)',
                  height: 12,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </Stack>
  )
}
