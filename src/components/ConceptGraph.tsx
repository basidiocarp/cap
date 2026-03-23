import type { GraphData as ForceGraphData, ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-2d'
import { Loader, Text } from '@mantine/core'
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
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined)
  const [width, setWidth] = useState(600)

  const { data: inspection, isLoading, isFetching } = useMemoirInspect(memoir, concept ?? '', depth)

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

  const graphData: ForceGraphData<GraphNode, GraphLink> = useMemo(() => {
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

  // Configure forces for better spread when graph data changes.
  useEffect(() => {
    const fg = graphRef.current
    if (!fg || graphData.nodes.length === 0) return
    fg.d3Force('charge')?.strength(-200)
    fg.d3Force('link')?.distance(80)
    fg.d3ReheatSimulation()
  }, [graphData])

  const handleNodeClick = useCallback(
    (node: NodeObject<GraphNode>) => {
      if (node.id && onNodeClick) {
        onNodeClick(String(node.id))
      }
    },
    [onNodeClick]
  )

  const nodeVal = useCallback((node: NodeObject<GraphNode>) => {
    const confidence = node.confidence ?? 0.5
    return MIN_NODE_SIZE + confidence * (MAX_NODE_SIZE - MIN_NODE_SIZE)
  }, [])

  const nodeCanvasObject = useCallback((node: NodeObject<GraphNode>, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label ?? String(node.id ?? '')
    const x = node.x ?? 0
    const y = node.y ?? 0
    const confidence = node.confidence ?? 0.5
    const radius = MIN_NODE_SIZE + confidence * (MAX_NODE_SIZE - MIN_NODE_SIZE)
    const color = node.color ?? DEFAULT_NODE_COLOR

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
  }, [])

  const linkLabel = useCallback((link: LinkObject<GraphNode, GraphLink>) => {
    return link.relation ?? ''
  }, [])

  const linkColor = useCallback((link: LinkObject<GraphNode, GraphLink>) => {
    return link.color ?? DEFAULT_EDGE_COLOR
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

  if (isLoading && !inspection) {
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
      style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s', width: '100%' }}
    >
      <ForceGraph2D<GraphNode, GraphLink>
        backgroundColor='transparent'
        cooldownTicks={50}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.3}
        graphData={graphData}
        height={GRAPH_HEIGHT}
        linkColor={linkColor}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkLabel={linkLabel}
        linkWidth={1.5}
        nodeCanvasObject={nodeCanvasObject}
        nodeVal={nodeVal}
        onNodeClick={handleNodeClick}
        ref={graphRef}
        warmupTicks={30}
        width={width}
      />
    </div>
  )
}
