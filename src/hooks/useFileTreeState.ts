import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import type { FileNode } from '../lib/api'
import { rhizomeApi } from '../lib/api'
import { rhizomeKeys, useFileTree } from '../lib/queries'

export interface FileTreeState {
  error: string | null
  expanded: Set<string>
  fileTree: Map<string, FileNode[]>
  handleExpand: (dirPath: string) => Promise<void>
  loadSymbols: (filePath: string) => void
  rootNodes: FileNode[]
  selectedFile: string | null
  setError: (error: string | null) => void
  treeLoading: boolean
}

export function useFileTreeState(
  fileParam: string | null,
  symbolParam: string | null,
  treeUnavailable: boolean,
  onFileSelected?: (file: string | null, symbol: string | null) => void
): FileTreeState {
  const queryClient = useQueryClient()

  const [fileTree, setFileTree] = useState<Map<string, FileNode[]>>(new Map())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedDirs, setLoadedDirs] = useState<Set<string>>(new Set())

  const { data: initialTree, isLoading: treeLoading } = useFileTree(undefined, 2)

  useEffect(() => {
    if (!initialTree) return
    const tree = new Map<string, FileNode[]>()
    tree.set('', initialTree)
    const indexChildren = (items: FileNode[]) => {
      for (const node of items) {
        if (node.type === 'dir' && node.children) {
          tree.set(node.path, node.children)
          indexChildren(node.children)
        }
      }
    }
    indexChildren(initialTree)
    setFileTree(tree)
    setLoadedDirs(new Set(tree.keys()))
  }, [initialTree])

  useEffect(() => {
    if (!fileParam || treeLoading || treeUnavailable) return
    const parts = fileParam.split('/')
    const dirs: string[] = []
    for (let i = 0; i < parts.length - 1; i++) {
      dirs.push(parts.slice(0, i + 1).join('/'))
    }
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const d of dirs) next.add(d)
      return next
    })
    setSelectedFile(fileParam)
    onFileSelected?.(fileParam, symbolParam)
  }, [fileParam, symbolParam, treeLoading, treeUnavailable, onFileSelected])

  const handleExpand = useCallback(
    async (dirPath: string) => {
      setExpanded((prev) => {
        const next = new Set(prev)
        if (next.has(dirPath)) {
          next.delete(dirPath)
        } else {
          next.add(dirPath)
        }
        return next
      })
      if (!loadedDirs.has(dirPath)) {
        try {
          const children = await queryClient.fetchQuery({
            queryFn: () => rhizomeApi.files(dirPath, 1),
            queryKey: rhizomeKeys.files(dirPath, 1),
          })
          setFileTree((prev) => {
            const next = new Map(prev)
            next.set(dirPath, children)
            return next
          })
          setLoadedDirs((prev) => {
            const next = new Set(prev)
            next.add(dirPath)
            return next
          })
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to load directory')
        }
      }
    },
    [loadedDirs, queryClient]
  )

  const loadSymbols = useCallback((filePath: string) => {
    setSelectedFile(filePath)
  }, [])

  const rootNodes = fileTree.get('') ?? []

  return {
    error,
    expanded,
    fileTree,
    handleExpand,
    loadSymbols,
    rootNodes,
    selectedFile,
    setError,
    treeLoading,
  }
}
