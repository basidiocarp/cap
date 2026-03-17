import type { Edge, Node } from '@xyflow/react'
import { Background, Controls, MarkerType, MiniMap, ReactFlow } from '@xyflow/react'
import { useCallback, useMemo } from 'react'
import '@xyflow/react/dist/style.css'

import { useEcosystemStatus } from '../lib/queries'

// ─────────────────────────────────────────────────────────────────────────────
// Node definitions
// ─────────────────────────────────────────────────────────────────────────────

interface ToolNode {
  id: string
  label: string
  color: string
  borderColor: string
  position: { x: number; y: number }
}

const TOOL_NODES: readonly ToolNode[] = [
  { borderColor: '#3d4a5c', color: '#505f79', id: 'agent', label: 'Agent', position: { x: 300, y: 0 } },
  { borderColor: '#e5623f', color: '#ff7452', id: 'mycelium', label: 'Mycelium', position: { x: 50, y: 0 } },
  { borderColor: '#2a9d6c', color: '#36b37e', id: 'hyphae', label: 'Hyphae', position: { x: 300, y: 160 } },
  { borderColor: '#5243a5', color: '#6554c0', id: 'rhizome', label: 'Rhizome', position: { x: 550, y: 0 } },
  { borderColor: '#3a86e5', color: '#4c9aff', id: 'cap', label: 'Cap', position: { x: 300, y: 320 } },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Edge definitions
// ─────────────────────────────────────────────────────────────────────────────

interface ToolEdge {
  source: string
  target: string
  label: string
}

const TOOL_EDGES: readonly ToolEdge[] = [
  { label: 'commands', source: 'agent', target: 'mycelium' },
  { label: 'filtered output', source: 'mycelium', target: 'agent' },
  { label: 'MCP tools', source: 'agent', target: 'hyphae' },
  { label: 'memories', source: 'hyphae', target: 'agent' },
  { label: 'MCP tools', source: 'agent', target: 'rhizome' },
  { label: 'symbols', source: 'rhizome', target: 'agent' },
  { label: 'code graphs', source: 'rhizome', target: 'hyphae' },
  { label: 'large outputs', source: 'mycelium', target: 'hyphae' },
  { label: 'reads', source: 'cap', target: 'hyphae' },
  { label: 'reads', source: 'cap', target: 'mycelium' },
  { label: 'MCP', source: 'cap', target: 'rhizome' },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Availability resolution
// ─────────────────────────────────────────────────────────────────────────────

function resolveAvailability(
  toolId: string,
  status: { mycelium: { available: boolean }; hyphae: { available: boolean }; rhizome: { available: boolean } } | undefined
): boolean {
  if (!status) return false
  switch (toolId) {
    case 'mycelium':
      return status.mycelium.available
    case 'hyphae':
      return status.hyphae.available
    case 'rhizome':
      return status.rhizome.available
    case 'cap':
      return true
    case 'agent':
      return true
    default:
      return false
  }
}

function sourceColor(sourceId: string): string {
  const node = TOOL_NODES.find((n) => n.id === sourceId)
  return node?.color ?? '#505f79'
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function EcosystemFlow() {
  const { data: status } = useEcosystemStatus()

  const nodes: Node[] = useMemo(
    () =>
      TOOL_NODES.map((tool) => {
        const available = resolveAvailability(tool.id, status)
        return {
          data: { label: tool.label },
          id: tool.id,
          position: tool.position,
          style: {
            background: tool.color,
            border: `2px solid ${tool.borderColor}`,
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            opacity: available ? 1 : 0.4,
            padding: '10px 20px',
          },
        }
      }),
    [status]
  )

  const edges: Edge[] = useMemo(
    () =>
      TOOL_EDGES.map((edge, i) => {
        const sourceAvailable = resolveAvailability(edge.source, status)
        const targetAvailable = resolveAvailability(edge.target, status)
        const active = sourceAvailable && targetAvailable

        return {
          animated: active,
          id: `e-${edge.source}-${edge.target}-${i}`,
          label: edge.label,
          labelStyle: {
            fill: '#adb5bd',
            fontSize: 10,
          },
          markerEnd: {
            color: sourceColor(edge.source),
            type: MarkerType.ArrowClosed,
          },
          source: edge.source,
          style: {
            opacity: active ? 0.8 : 0.2,
            stroke: sourceColor(edge.source),
            strokeWidth: 2,
          },
          target: edge.target,
        }
      }),
    [status]
  )

  const onInit = useCallback(() => {}, [])

  return (
    <ReactFlow
      edges={edges}
      elementsSelectable={false}
      fitView
      nodes={nodes}
      nodesConnectable={false}
      nodesDraggable={true}
      onInit={onInit}
      proOptions={{ hideAttribution: true }}
    >
      <Controls showInteractive={false} />
      <MiniMap
        maskColor='rgba(0, 0, 0, 0.5)'
        nodeColor={(node) => (node.style?.background as string) ?? '#505f79'}
      />
      <Background
        gap={20}
        size={1}
      />
    </ReactFlow>
  )
}
