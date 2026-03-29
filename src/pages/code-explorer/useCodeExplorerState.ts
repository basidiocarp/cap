import { useDisclosure } from '@mantine/hooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useFileTreeState } from '../../hooks/useFileTreeState'
import { useDefinition, useExports, useFileSummary, useProjectContextController, useRhizomeStatus, useSymbols } from '../../lib/queries'
import { memoirsHref, memoriesHref, symbolSearchHref } from '../../lib/routes'
import { useProjectContextView } from '../../store/project-context'
import { parseCodeExplorerUrlState, toDisplaySymbols, writeCodeExplorerUrlState } from './code-explorer-url-state'
import { isCodeFile } from './code-file-utils'

export function useCodeExplorerState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlState = useMemo(() => parseCodeExplorerUrlState(searchParams), [searchParams])

  const [treeOpen, treeControls] = useDisclosure(false)
  const [showFullDef, setShowFullDef] = useState(false)

  const { data: statusData } = useRhizomeStatus()
  const { data: project } = useProjectContextController()
  const { activeProject, recentProjects } = useProjectContextView(project)
  const unavailable = statusData ? !statusData.available : false
  const projectName = activeProject?.split('/').pop() ?? 'project'
  const codeMemoirName = `code:${projectName}`
  const selectedFile = urlState.file || null
  const expandedSymbol = urlState.symbol || null
  const symbolFilter = urlState.filter
  const symbolMode = urlState.mode
  const isExportsMode = symbolMode === 'exports'
  const codeFile = selectedFile && isCodeFile(selectedFile) ? selectedFile : ''
  const tree = useFileTreeState(selectedFile, expandedSymbol, unavailable)
  const treeView = { ...tree, selectedFile }
  const symbolContext = `${selectedFile ?? ''}:${expandedSymbol ?? ''}:${symbolMode}`
  const previousSymbolContext = useRef(symbolContext)

  const updateUrlState = useCallback(
    (updater: (state: ReturnType<typeof parseCodeExplorerUrlState>) => ReturnType<typeof parseCodeExplorerUrlState>) => {
      setSearchParams((current) => writeCodeExplorerUrlState(current, updater(parseCodeExplorerUrlState(current))))
    },
    [setSearchParams]
  )

  const { data: symbols = [], isLoading: symbolsLoading } = useSymbols(codeFile, !isExportsMode)
  const { data: definition, isLoading: defLoading } = useDefinition(codeFile, expandedSymbol ?? '')
  const { data: exports = [], isLoading: exportsLoading } = useExports(codeFile, isExportsMode)
  const { data: fileSummary, isLoading: summaryLoading } = useFileSummary(codeFile)

  const handleLoadSymbols = useCallback(
    (filePath: string) => {
      tree.loadSymbols(filePath)
      setShowFullDef(false)
      updateUrlState((state) => ({
        ...state,
        file: filePath,
        symbol: '',
      }))
    },
    [tree, updateUrlState]
  )

  const handleSymbolClick = useCallback(
    (symbolName: string) => {
      setShowFullDef(false)
      updateUrlState((state) => ({
        ...state,
        symbol: state.symbol === symbolName ? '' : symbolName,
      }))
    },
    [updateUrlState]
  )

  const displaySymbols = useMemo(
    () => toDisplaySymbols(symbols, exports, selectedFile ?? '', symbolMode),
    [exports, selectedFile, symbolMode, symbols]
  )

  const filteredSymbols = useMemo(() => {
    if (!symbolFilter.trim()) return displaySymbols
    const query = symbolFilter.toLowerCase()
    return displaySymbols.filter((symbol) => symbol.name.toLowerCase().includes(query))
  }, [displaySymbols, symbolFilter])

  useEffect(() => {
    if (previousSymbolContext.current === symbolContext) return
    previousSymbolContext.current = symbolContext
    setShowFullDef(false)
  }, [symbolContext])

  const { defPreview, hasMoreLines } = useMemo(() => {
    if (!definition?.body) return { defPreview: '', hasMoreLines: false }
    const lines = definition.body.split('\n')
    return {
      defPreview: lines.slice(0, 20).join('\n'),
      hasMoreLines: lines.length > 20,
    }
  }, [definition])

  return {
    activeProject,
    codeMemoirName,
    definition,
    defLoading,
    defPreview,
    displaySymbols,
    expandedSymbol,
    explorerLinks: {
      searchMemoirsHref: expandedSymbol ? memoirsHref({ concept: expandedSymbol, memoir: codeMemoirName }) : memoirsHref(),
      searchMemoriesHref: expandedSymbol ? memoriesHref({ q: expandedSymbol }) : memoriesHref(),
      searchSymbolsHref: expandedSymbol ? symbolSearchHref(expandedSymbol) : symbolSearchHref(),
    },
    exports,
    exportsLoading,
    fileSummary,
    filteredSymbols,
    handleLoadSymbols,
    handleSymbolClick,
    hasMoreLines,
    projectName,
    recentProjects,
    selectedFile,
    setShowFullDef,
    showFullDef,
    summaryLoading,
    symbolFilter,
    symbolMode,
    symbolsLoading,
    toggleTree: treeControls.toggle,
    treeLoading: tree.treeLoading,
    treeOpen,
    treeView,
    unavailable,
    updateUrlState,
  }
}
