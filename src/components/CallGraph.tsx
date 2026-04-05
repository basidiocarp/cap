import type { Edge, Node } from '@xyflow/react'
import { Loader, Text } from '@mantine/core'
import { Background, Controls, MarkerType, ReactFlow } from '@xyflow/react'
import { useMemo } from 'react'
import '@xyflow/react/dist/style.css'

import { useDependencies } from '../lib/queries'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CallGraphProps {
  enabled?: boolean
  file: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Node colors by dependency type
// ─────────────────────────────────────────────────────────────────────────────

const NODE_COLOR_FUNCTION = '#36b37e'
const NODE_COLOR_HUB = '#845ef7'
const NODE_COLOR_IMPORT = '#4c9aff'
const NODE_COLOR_EXTERNAL = '#505f79'
const EDGE_COLOR = '#6554c0'

type NodeRole = 'caller' | 'callee' | 'external' | 'hub'

function classifyNode(name: string, callers: Set<string>, callees: Set<string>): NodeRole {
  if (name.includes('/') || name.includes('.') || name.includes('::')) {
    return 'external'
  }
  const isCaller = callers.has(name)
  const isCallee = callees.has(name)

  if (isCaller && isCallee) {
    return 'hub'
  }
  if (isCaller) {
    return 'caller'
  }
  if (isCallee) {
    return 'callee'
  }
  return 'hub'
}

function colorForType(type: string): string {
  switch (type) {
    case 'caller':
      return NODE_COLOR_FUNCTION
    case 'callee':
      return NODE_COLOR_IMPORT
    case 'hub':
      return NODE_COLOR_HUB
    default:
      return NODE_COLOR_EXTERNAL
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout helper
// ─────────────────────────────────────────────────────────────────────────────

const COL_WIDTH = 220
const ROW_HEIGHT = 80

function layoutNodes(names: string[], callers: Set<string>, callees: Set<string>): Node[] {
  const grouped = new Map<NodeRole, string[]>([
    ['caller', []],
    ['hub', []],
    ['callee', []],
    ['external', []],
  ])

  for (const name of names) {
    grouped.get(classifyNode(name, callers, callees))?.push(name)
  }

  const roleOrder: NodeRole[] = ['caller', 'hub', 'callee', 'external']

  return roleOrder.flatMap((role, roleIndex) => {
    const nodes = grouped
      .get(role)!
      .sort((a, b) => {
        const degreeDelta = (callers.has(b) ? 1 : 0) + (callees.has(b) ? 1 : 0) - ((callers.has(a) ? 1 : 0) + (callees.has(a) ? 1 : 0))
        return degreeDelta || a.localeCompare(b)
      })

    return nodes.map((name, i) => {
      const type = classifyNode(name, callers, callees)
      return {
        data: { label: name },
        id: name,
        position: { x: roleIndex * COL_WIDTH, y: i * ROW_HEIGHT },
        style: {
          background: colorForType(type),
          border: `2px solid ${colorForType(type)}`,
          borderRadius: 8,
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          opacity: 1,
          padding: '6px 14px',
        },
      }
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CallGraph({ enabled = true, file }: CallGraphProps) {
  const { data: dependencies = [], isLoading } = useDependencies(file ?? '', enabled)

  const { nodes, edges } = useMemo(() => {
    if (!Array.isArray(dependencies) || dependencies.length === 0) {
      return { edges: [], nodes: [] }
    }

    const callerSet = new Set(dependencies.map((d) => d.caller))
    const calleeSet = new Set(dependencies.map((d) => d.callee))
    const allNames = [...new Set([...callerSet, ...calleeSet])]

    const flowNodes = layoutNodes(allNames, callerSet, calleeSet)

    const flowEdges: Edge[] = dependencies.map((dep, i) => ({
      animated: false,
      id: `dep-${dep.caller}-${dep.callee}-${i}`,
      label: `L${dep.line}`,
      labelStyle: { fill: '#adb5bd', fontSize: 9 },
      markerEnd: {
        color: EDGE_COLOR,
        type: MarkerType.ArrowClosed,
      },
      source: dep.caller,
      style: { stroke: EDGE_COLOR, strokeWidth: 1.5 },
      target: dep.callee,
    }))

    return { edges: flowEdges, nodes: flowNodes }
  }, [dependencies])

  if (!file) {
    return (
      <Text
        c='dimmed'
        size='sm'
      >
        Select a file to view dependencies
      </Text>
    )
  }

  if (isLoading) {
    return <Loader size='sm' />
  }

  if (dependencies.length === 0) {
    return (
      <Text
        c='dimmed'
        size='sm'
      >
        No dependency data available
      </Text>
    )
  }

  return (
    <div style={{ height: 300 }}>
      <ReactFlow
        edges={edges}
        elementsSelectable={false}
        fitView
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
        <Background
          gap={16}
          size={1}
        />
      </ReactFlow>
    </div>
  )
}
