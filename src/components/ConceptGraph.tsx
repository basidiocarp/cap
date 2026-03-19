import { Loader, Text } from '@mantine/core'
import type { ForceGraphMethods } from 'react-force-graph-2d'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

import { parseJsonArray } from '../lib/parse'
import { useMemoirInspect } from '../lib/queries'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ConceptGraphProps {
  concept?: string
  depth?: number
  memoir: string
  onNodeClick?: (concept: string) => void
}

interface GraphNode {
  color: string
  confidence: number
  id: string
  label: string
  labelType: string
}

interface GraphLink {
  color: string
  relation: string
  source: string
  target: string
}

interface GraphData {
  links: GraphLink[]
  nodes: GraphNode[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Color Mappings
// ─────────────────────────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  class: '#9775fa',
  function: '#20c997',
  interface: '#ff9800',
  method: '#20c997',
  module: '#334e68',
  struct: '#9775fa',
  trait: '#ff9800',
}

const EDGE_COLORS: Record<string, string> = {
  calls: '#ffa726',
  contains: '#627d98',
  implements: '#9775fa',
  imports: '#00bcd4',
}

const DEFAULT_NODE_COLOR = '#ffca28'
const DEFAULT_EDGE_COLOR = '#627d98'

function nodeColorForLabels(labels: string): string {
  const parsed = parseJsonArray<{ namespace: string; value: string }>(labels)
  for (const { value } of parsed) {
    const lower = value.toLowerCase()
    if (NODE_COLORS[lower]) {
      return NODE_COLORS[lower]
    }
  }
  return DEFAULT_NODE_COLOR
}

function labelTypeFromLabels(labels: string): string {
  const parsed = parseJsonArray<{ namespace: string; value: string }>(labels)
  for (const { value } of parsed) {
    return value.toLowerCase()
  }
  return 'other'
}

function edgeColor(relation: string): string {
  return EDGE_COLORS[relation.toLowerCase()] ?? DEFAULT_EDGE_COLOR
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH_HEIGHT = 450
const MIN_NODE_SIZE = 3
const MAX_NODE_SIZE = 10

export function ConceptGraph({ concept, depth = 2, memoir, onNodeClick }: ConceptGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [width, setWidth] = useState(600)

  const { data: inspection, isLoading } = useMemoirInspect(memoir, concept ?? '', depth)

  // Configure forces for better spread when graph data changes
  useEffect(() => {
    const fg = graphRef.current
    if (!fg) return
    fg.d3Force('charge')?.strength(-200)
    fg.d3Force('link')?.distance(80)
    // Re-heat simulation briefly on data change
    fg.d3ReheatSimulation()
  }, [inspection])

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  const graphData: GraphData = useMemo(() => {
    if (!inspection) {
      return { links: [], nodes: [] }
    }

    const nodeMap = new Map<string, GraphNode>()

    const centerNode: GraphNode = {
      color: nodeColorForLabels(inspection.concept.labels),
      confidence: inspection.concept.confidence,
      id: inspection.concept.name,
      label: inspection.concept.name,
      labelType: labelTypeFromLabels(inspection.concept.labels),
    }
    nodeMap.set(centerNode.id, centerNode)

    const links: GraphLink[] = []

    for (const neighbor of inspection.neighbors) {
      const neighborNode: GraphNode = {
        color: nodeColorForLabels(neighbor.concept.labels),
        confidence: neighbor.concept.confidence,
        id: neighbor.concept.name,
        label: neighbor.concept.name,
        labelType: labelTypeFromLabels(neighbor.concept.labels),
      }

      if (!nodeMap.has(neighborNode.id)) {
        nodeMap.set(neighborNode.id, neighborNode)
      }

      const link: GraphLink =
        neighbor.direction === 'outgoing'
          ? {
              color: edgeColor(neighbor.link.relation),
              relation: neighbor.link.relation,
              source: inspection.concept.name,
              target: neighbor.concept.name,
            }
          : {
              color: edgeColor(neighbor.link.relation),
              relation: neighbor.link.relation,
              source: neighbor.concept.name,
              target: inspection.concept.name,
            }

      links.push(link)
    }

    return {
      links,
      nodes: Array.from(nodeMap.values()),
    }
  }, [inspection])

  const handleNodeClick = useCallback(
    (node: { id?: string }) => {
      if (node.id && onNodeClick) {
        onNodeClick(String(node.id))
      }
    },
    [onNodeClick]
  )

  const nodeVal = useCallback((node: { confidence?: number }) => {
    const confidence = (node as GraphNode).confidence ?? 0.5
    return MIN_NODE_SIZE + confidence * (MAX_NODE_SIZE - MIN_NODE_SIZE)
  }, [])

  const nodeCanvasObject = useCallback(
    (node: { color?: string; id?: string; label?: string; x?: number; y?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const graphNode = node as GraphNode & { x?: number; y?: number }
      const label = graphNode.label ?? String(graphNode.id ?? '')
      const x = graphNode.x ?? 0
      const y = graphNode.y ?? 0
      const confidence = graphNode.confidence ?? 0.5
      const radius = MIN_NODE_SIZE + confidence * (MAX_NODE_SIZE - MIN_NODE_SIZE)
      const color = graphNode.color ?? DEFAULT_NODE_COLOR

      // Draw node circle
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      // Draw label when zoomed in enough
      const fontSize = Math.max(12 / globalScale, 2)
      if (globalScale > 0.8) {
        ctx.font = `${fontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#e0e0e0'
        ctx.fillText(label, x, y + radius + 2)
      }
    },
    []
  )

  const linkLabel = useCallback((link: { relation?: string }) => {
    return (link as GraphLink).relation ?? ''
  }, [])

  const linkColor = useCallback((link: { color?: string }) => {
    return (link as GraphLink).color ?? DEFAULT_EDGE_COLOR
  }, [])

  if (!concept) {
    return (
      <Text
        c='dimmed'
        size='sm'
      >
        Select a concept to view its knowledge graph
      </Text>
    )
  }

  if (isLoading) {
    return <Loader size='sm' />
  }

  if (!inspection || graphData.nodes.length === 0) {
    return (
      <Text
        c='dimmed'
        size='sm'
      >
        No graph data available for this concept
      </Text>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%' }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ForceGraph2D
        ref={graphRef as any}
        backgroundColor='transparent'
        cooldownTicks={50}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.3}
        graphData={graphData as any}
        height={GRAPH_HEIGHT}
        linkColor={linkColor as any}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkLabel={linkLabel as any}
        linkWidth={1.5}
        nodeCanvasObject={nodeCanvasObject as any}
        nodeVal={nodeVal as any}
        onNodeClick={handleNodeClick as any}
        warmupTicks={30}
        width={width}
      />
    </div>
  )
}
