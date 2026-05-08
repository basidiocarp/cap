import type { NodeObject } from 'react-force-graph-2d'
import { Badge, Group, Loader, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

import type { MemoirGraphEdge, MemoirGraphNode } from '../../lib/types/hyphae'
import { ErrorAlert } from '../../components/ErrorAlert'
import { SectionCard } from '../../components/SectionCard'
import { useMemoirGraph } from '../../lib/queries'
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
  const { currentNodeId, selectedMemoirName, setCurrentNodeId, setSelectedMemoirName } = useMemoirGraphStore()
  const graphQuery = useMemoirGraph(selectedMemoirName ?? '')
  const [filter, setFilter] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  // ResizeObserver for container width
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Filter nodes by label
  const filteredNodes = useMemo(() => {
    const nodes = graphQuery.data?.nodes ?? []
    if (!filter) return nodes
    const lowerFilter = filter.toLowerCase()
    return nodes.filter((node) => node.label.toLowerCase().includes(lowerFilter))
  }, [graphQuery.data?.nodes, filter])

  // Filter edges to only include those where both source and target are in filtered nodes
  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes])
  const filteredEdges = useMemo(() => {
    const edges = graphQuery.data?.edges ?? []
    return edges.filter((edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target))
  }, [graphQuery.data?.edges, filteredNodeIds])

  // Get current node from data
  const currentNode = useMemo(() => {
    if (!currentNodeId) return null
    return graphQuery.data?.nodes.find((n) => n.id === currentNodeId) ?? null
  }, [currentNodeId, graphQuery.data?.nodes])

  // Get related edges for current node
  const relatedEdges = useMemo(() => {
    if (!currentNode) return []
    return (graphQuery.data?.edges ?? []).filter((edge) => edge.source === currentNode.id || edge.target === currentNode.id)
  }, [currentNode, graphQuery.data?.edges])

  const getOtherNodeLabel = (edge: MemoirGraphEdge): string => {
    const otherNodeId = edge.source === currentNode?.id ? edge.target : edge.source
    return (graphQuery.data?.nodes ?? []).find((n) => n.id === otherNodeId)?.label ?? '?'
  }

  const handleNodeClick = (node: NodeObject<MemoirGraphNode>) => {
    if (node.id) setCurrentNodeId(String(node.id))
  }

  return (
    <Stack gap="md" h="100%" p="md">
      <Title order={2}>Memoir Graph</Title>

      <Group gap="md" wrap="nowrap">
        <Select
          data={memoirNames}
          onChange={(value) => setSelectedMemoirName(value)}
          placeholder="Select a memoir…"
          searchable
          style={{ minWidth: 200 }}
          value={selectedMemoirName}
        />
        {selectedMemoirName && (
          <TextInput
            leftSection={<IconSearch size={14} />}
            onChange={(e) => setFilter(e.currentTarget.value)}
            placeholder="Filter concepts…"
            value={filter}
            style={{ flex: 1 }}
          />
        )}
      </Group>

      <ErrorAlert error={graphQuery.error} title="Failed to load graph" />

      {graphQuery.isLoading && <Loader size="sm" />}

      {!selectedMemoirName && (
        <Text c="dimmed" size="sm">
          Select a memoir above to explore its concept graph.
        </Text>
      )}

      <div style={{ display: 'flex', gap: 16, minHeight: 500, flex: 1 }}>
        <div ref={containerRef} style={{ flex: 1 }}>
          {filteredNodes.length > 0 ? (
            <ForceGraph2D<MemoirGraphNode>
              graphData={{ links: filteredEdges.map((e) => ({ ...e })), nodes: filteredNodes.map((n) => ({ ...n })) }}
              linkLabel="label"
              nodeColor={(node) => communityColor(node.community_id)}
              nodeLabel="label"
              onNodeClick={handleNodeClick}
              width={width}
            />
          ) : selectedMemoirName && !graphQuery.isLoading ? (
            <Text c="dimmed" p="xl">
              No concepts match the current filter.
            </Text>
          ) : null}
        </div>

        {currentNode && (
          <SectionCard title={currentNode.label} style={{ width: 280, flexShrink: 0 }}>
            <Stack gap="xs">
              <Text size="sm">{currentNode.definition}</Text>
              {relatedEdges.length > 0 && (
                <>
                  <Text fw={500} size="xs" mt="xs">
                    Relationships
                  </Text>
                  {relatedEdges.map((edge) => (
                    <Group key={edge.id} gap="xs" wrap="nowrap">
                      <Badge size="xs" variant="light">
                        {edge.label}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {edge.source === currentNode.id ? '→' : '←'} {getOtherNodeLabel(edge)}
                      </Text>
                    </Group>
                  ))}
                </>
              )}
              {currentNode.community_id && <Text size="xs" c="dimmed">Community: {currentNode.community_id}</Text>}
            </Stack>
          </SectionCard>
        )}
      </div>
    </Stack>
  )
}
