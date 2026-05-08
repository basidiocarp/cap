import { create } from 'zustand'

interface MemoirGraphState {
  currentNodeId: string | null
  selectedMemoirName: string | null
  setCurrentNodeId: (id: string | null) => void
  setSelectedMemoirName: (name: string | null) => void
}

export const useMemoirGraphStore = create<MemoirGraphState>((set) => ({
  currentNodeId: null,
  selectedMemoirName: null,
  setCurrentNodeId: (id) => set({ currentNodeId: id }),
  setSelectedMemoirName: (name) => set({ currentNodeId: null, selectedMemoirName: name }),
}))
