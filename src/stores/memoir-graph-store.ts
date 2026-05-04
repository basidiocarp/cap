import { create } from 'zustand'

import type { MemoirGraphEdge, MemoirGraphNode } from '../lib/types/hyphae'

interface MemoirGraphState {
  currentNodeId: string | null
  edges: MemoirGraphEdge[]
  // Scaffolded for the edge-delete handoff (hyphae/memoir-unlink-command)
  edgesMapping: Map<string, MemoirGraphEdge>
  nodes: MemoirGraphNode[]
  nodesMapping: Map<string, MemoirGraphNode>
  selectedMemoirName: string | null
  setCurrentNodeId: (id: string | null) => void
  setGraphData: (nodes: MemoirGraphNode[], edges: MemoirGraphEdge[]) => void
  setSelectedMemoirName: (name: string | null) => void
}

export const useMemoirGraphStore = create<MemoirGraphState>((set) => ({
  currentNodeId: null,
  edges: [],
  edgesMapping: new Map(),
  nodes: [],
  nodesMapping: new Map(),
  selectedMemoirName: null,
  setCurrentNodeId: (id) => set({ currentNodeId: id }),
  setGraphData: (nodes, edges) =>
    set({
      edges,
      edgesMapping: new Map(edges.map((e) => [e.id, e])),
      nodes,
      nodesMapping: new Map(nodes.map((n) => [n.id, n])),
    }),
  setSelectedMemoirName: (name) => set({ currentNodeId: null, selectedMemoirName: name }),
}))
