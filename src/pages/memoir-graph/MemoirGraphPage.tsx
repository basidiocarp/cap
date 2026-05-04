import type { NodeObject } from 'react-force-graph-2d'
import { Select, Stack, Text } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

import type { MemoirGraphNode } from '../../lib/types/hyphae'
import { hyphaeApi } from '../../lib/api'
import { useMemoirGraphStore } from '../../stores/memoir-graph-store'

const COMMUNITY_COLORS = ['#4dabf7', '#ff6b6b', '#69db7c', '#ffd43b', '#cc5de8', '#ff922b', '#20c997', '#f783ac']

function communityColor(communityId: string | null | undefined): string {
  if (!communityId) return '#adb5bd'
  const match = communityId.match(/^community_(\d+)$/)
  if (match) return COMMUNITY_COLORS[parseInt(match[1], 10) % COMMUNITY_COLORS.length]
  let hash = 0
  for (let i = 0; i < communityId.length; i++) hash = (hash << 5) - hash + communityId.charCodeAt(i)
  return COMMUNITY_COLORS[Math.abs(hash) % COMMUNITY_COLORS.length]
}

interface MemoirGraphPageProps {
  memoirNames: string[]
}

export function MemoirGraphPage({ memoirNames }: MemoirGraphPageProps) {
  const { currentNodeId, edges, nodes, nodesMapping, selectedMemoirName, setCurrentNodeId, setGraphData, setSelectedMemoirName } =
    useMemoirGraphStore()

  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!selectedMemoirName) return
    setError(null)
    hyphaeApi
      .memoirGraph(selectedMemoirName)
      .then(({ nodes: graphNodes, edges: graphEdges }) => setGraphData(graphNodes, graphEdges))
      .catch(() => setError('Failed to load memoir graph'))
  }, [selectedMemoirName, setGraphData])

  const currentNode = currentNodeId ? nodesMapping.get(currentNodeId) : null

  const handleNodeClick = (node: NodeObject<MemoirGraphNode>) => {
    if (node.id) setCurrentNodeId(String(node.id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ borderBottom: '1px solid var(--mantine-color-default-border)', padding: '8px 16px' }}>
        <Select
          data={memoirNames}
          onChange={(value) => setSelectedMemoirName(value)}
          placeholder='Select a memoir…'
          style={{ minWidth: 200 }}
          value={selectedMemoirName}
        />
      </div>
      {error && (
        <Text
          c='red'
          p='md'
          size='sm'
        >
          {error}
        </Text>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div
          ref={containerRef}
          style={{ flex: 1 }}
        >
          {nodes.length > 0 ? (
            <ForceGraph2D<MemoirGraphNode>
              graphData={{ links: edges.map((e) => ({ ...e })), nodes: nodes.map((n) => ({ ...n })) }}
              linkLabel='label'
              nodeColor={(node) => communityColor(node.community_id)}
              nodeLabel='label'
              onNodeClick={handleNodeClick}
              width={width}
            />
          ) : (
            <Text
              c='dimmed'
              p='xl'
            >
              {selectedMemoirName ? 'No concepts in this memoir.' : 'Select a memoir to view its graph.'}
            </Text>
          )}
        </div>
        {currentNode && (
          <Stack
            gap='xs'
            style={{
              borderLeft: '1px solid var(--mantine-color-default-border)',
              overflowY: 'auto',
              padding: 16,
              width: 300,
            }}
          >
            <Text fw={600}>{currentNode.label}</Text>
            <Text size='sm'>{currentNode.definition}</Text>
          </Stack>
        )}
      </div>
    </div>
  )
}
