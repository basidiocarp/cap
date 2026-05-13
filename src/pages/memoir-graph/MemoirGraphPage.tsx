import type { ForceGraphMethods, NodeObject } from 'react-force-graph-2d'
import { ActionIcon, Badge, Group, Loader, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconMinus, IconPlus, IconSearch } from '@tabler/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

import type { MemoirGraphEdge, MemoirGraphNode } from '../../lib/types/hyphae'
import { ErrorAlert } from '../../components/ErrorAlert'
import { SectionCard } from '../../components/SectionCard'
import { useMemoirs, useMemoirGraph } from '../../lib/queries'
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

export function MemoirGraphPage() {
  const { data: memoirList = [] } = useMemoirs()
  const memoirNames = memoirList.map((m) => m.name)
  const { currentNodeId, selectedMemoirName, setCurrentNodeId, setSelectedMemoirName } = useMemoirGraphStore()
  const graphQuery = useMemoirGraph(selectedMemoirName ?? '')
  const [filter, setFilter] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const fgRef = useRef<ForceGraphMethods<NodeObject<MemoirGraphNode>, {}>>(undefined)

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

  // Add val field for node size based on connectivity
  const graphNodes = useMemo(() => {
    const edgeCount = new Map<string, number>()
    for (const e of filteredEdges) {
      edgeCount.set(e.source, (edgeCount.get(e.source) ?? 0) + 1)
      edgeCount.set(e.target, (edgeCount.get(e.target) ?? 0) + 1)
    }
    return filteredNodes.map((n) => ({
      ...n,
      val: Math.max(1, Math.min(6, edgeCount.get(n.id) ?? 1)),
    }))
  }, [filteredNodes, filteredEdges])

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
    <Stack
      gap='md'
      h='100%'
      p='md'
    >
      <Title order={2}>Memoir Graph</Title>

      <Group
        gap='md'
        wrap='nowrap'
      >
        <Select
          data={memoirNames}
          onChange={(value) => setSelectedMemoirName(value)}
          placeholder='Select a memoir…'
          searchable
          style={{ minWidth: 200 }}
          value={selectedMemoirName}
        />
        {selectedMemoirName && (
          <TextInput
            leftSection={<IconSearch size={14} />}
            onChange={(e) => setFilter(e.currentTarget.value)}
            placeholder='Filter concepts…'
            style={{ flex: 1 }}
            value={filter}
          />
        )}
      </Group>

      <ErrorAlert
        error={graphQuery.error}
        title='Failed to load graph'
      />

      {graphQuery.isLoading && <Loader size='sm' />}

      {!selectedMemoirName && (
        <Text
          c='dimmed'
          size='sm'
        >
          Select a memoir above to explore its concept graph.
        </Text>
      )}

      <div style={{ display: 'flex', flex: 1, gap: 16, minHeight: 500 }}>
        <div
          ref={containerRef}
          style={{ flex: 1, position: 'relative' }}
        >
          {filteredNodes.length > 0 ? (
            <>
              <ForceGraph2D<MemoirGraphNode>
                graphData={{ links: filteredEdges.map((e) => ({ ...e })), nodes: graphNodes }}
                linkLabel='label'
                nodeCanvasObject={(node, ctx) => {
                  const x = node.x ?? 0
                  const y = node.y ?? 0
                  const r = Math.sqrt(Math.max(0, node.val ?? 1)) * 4
                  const isFresh = node.updated_at ? Date.now() - new Date(node.updated_at).getTime() < 7 * 24 * 60 * 60 * 1000 : true
                  ctx.save()
                  ctx.globalAlpha = isFresh ? 1.0 : 0.5
                  ctx.beginPath()
                  ctx.arc(x, y, r, 0, 2 * Math.PI)
                  ctx.fillStyle = communityColor(node.community_id)
                  ctx.fill()
                  ctx.restore()
                }}
                nodeCanvasObjectMode={() => 'replace'}
                nodeLabel='label'
                onNodeClick={handleNodeClick}
                ref={fgRef}
                width={width}
              />
              <div
                style={{
                  bottom: 16,
                  display: 'flex',
                  gap: 8,
                  position: 'absolute',
                  right: 16,
                  zIndex: 10,
                }}
              >
                <ActionIcon
                  onClick={() => fgRef.current?.zoom(1.4, 300)}
                  size='sm'
                  variant='default'
                >
                  <IconPlus size={14} />
                </ActionIcon>
                <ActionIcon
                  onClick={() => fgRef.current?.zoom(0.7, 300)}
                  size='sm'
                  variant='default'
                >
                  <IconMinus size={14} />
                </ActionIcon>
              </div>
            </>
          ) : selectedMemoirName && !graphQuery.isLoading ? (
            <Text
              c='dimmed'
              p='xl'
            >
              No concepts match the current filter.
            </Text>
          ) : null}
        </div>

        {currentNode && (
          <SectionCard
            style={{ flexShrink: 0, width: 280 }}
            title={currentNode.label}
          >
            <Stack gap='xs'>
              <Text size='sm'>{currentNode.definition}</Text>
              {relatedEdges.length > 0 && (
                <>
                  <Text
                    fw={500}
                    mt='xs'
                    size='xs'
                  >
                    Relationships
                  </Text>
                  {relatedEdges.map((edge) => (
                    <Group
                      gap='xs'
                      key={edge.id}
                      wrap='nowrap'
                    >
                      <Badge
                        size='xs'
                        variant='light'
                      >
                        {edge.label}
                      </Badge>
                      <Text
                        c='dimmed'
                        size='xs'
                      >
                        {edge.source === currentNode.id ? '→' : '←'} {getOtherNodeLabel(edge)}
                      </Text>
                    </Group>
                  ))}
                </>
              )}
              {currentNode.community_id && (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Community: {currentNode.community_id}
                </Text>
              )}
            </Stack>
          </SectionCard>
        )}
      </div>
    </Stack>
  )
}
