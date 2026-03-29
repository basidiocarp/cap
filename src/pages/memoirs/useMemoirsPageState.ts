import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useMemoir, useMemoirInspect, useMemoirs } from '../../lib/queries'
import { DEFAULT_MEMOIR_PAGE, readMemoirUrlState, writeMemoirUrlState } from './memoir-url-state'

const CONCEPTS_PAGE_SIZE = 200

export function useMemoirsPageState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialUrlState = readMemoirUrlState(searchParams)
  const [selected, setSelected] = useState<string | null>(() => initialUrlState.memoir || null)
  const [inspectConcept, setInspectConcept] = useState(initialUrlState.concept)
  const [conceptFilter, setConceptFilter] = useState(initialUrlState.filter)
  const [conceptPage, setConceptPage] = useState(initialUrlState.page)
  const [graphDepth, setGraphDepth] = useState(initialUrlState.depth)
  const [history, setHistory] = useState<string[]>([])
  const inspectRef = useRef<HTMLDivElement>(null)
  const deferredConceptFilter = useDeferredValue(conceptFilter.trim())

  useEffect(() => {
    const nextUrlState = readMemoirUrlState(searchParams)

    setHistory([])
    setSelected(nextUrlState.memoir || null)
    setInspectConcept(nextUrlState.concept)
    setConceptFilter(nextUrlState.filter)
    setConceptPage(nextUrlState.page)
    setGraphDepth(nextUrlState.depth)
  }, [searchParams])

  const memoirsQuery = useMemoirs()
  const detailQuery = useMemoir(selected ?? '', {
    limit: CONCEPTS_PAGE_SIZE,
    offset: (conceptPage - 1) * CONCEPTS_PAGE_SIZE,
    q: deferredConceptFilter || undefined,
  })
  const inspectQuery = useMemoirInspect(selected ?? '', inspectConcept, Number(graphDepth))

  const detail = detailQuery.data
  const totalPages = detail ? Math.max(1, Math.ceil(detail.total_concepts / CONCEPTS_PAGE_SIZE)) : 1
  const currentRangeStart = detail && detail.total_concepts > 0 ? detail.offset + 1 : 0
  const currentRangeEnd = detail ? Math.min(detail.offset + detail.concepts.length, detail.total_concepts) : 0

  useEffect(() => {
    if (!inspectConcept) return
    inspectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [inspectConcept])

  function commitUrlState(nextState: { concept: string; depth: string; filter: string; memoir: string; page: number }) {
    setSearchParams(writeMemoirUrlState(searchParams, nextState))
  }

  function handleSelectMemoir(name: string) {
    setSelected(name)
    setInspectConcept('')
    setConceptFilter('')
    setConceptPage(1)
    setHistory([])
    commitUrlState({
      concept: '',
      depth: graphDepth,
      filter: '',
      memoir: name,
      page: DEFAULT_MEMOIR_PAGE,
    })
  }

  function handleInspect(conceptName: string) {
    if (!conceptName.trim() || !selected) return
    if (inspectConcept && inspectConcept !== conceptName) {
      setHistory((prev) => [...prev.slice(-9), inspectConcept])
    }
    setInspectConcept(conceptName)
    commitUrlState({
      concept: conceptName,
      depth: graphDepth,
      filter: conceptFilter,
      memoir: selected,
      page: conceptPage,
    })
  }

  function handleBack() {
    if (history.length === 0) return
    const previous = history[history.length - 1]
    setHistory((entries) => entries.slice(0, -1))
    setInspectConcept(previous)
    commitUrlState({
      concept: previous,
      depth: graphDepth,
      filter: conceptFilter,
      memoir: selected ?? '',
      page: conceptPage,
    })
  }

  return {
    commitUrlState,
    conceptFilter,
    conceptPage,
    currentRangeEnd,
    currentRangeStart,
    detail,
    detailLoading: detailQuery.isLoading,
    graphDepth,
    handleBack,
    handleInspect,
    handleSelectMemoir,
    history,
    inspectConcept,
    inspection: inspectQuery.data,
    inspectLoading: inspectQuery.isLoading,
    inspectRef,
    memoirs: memoirsQuery.data ?? [],
    memoirsError: memoirsQuery.error,
    memoirsLoading: memoirsQuery.isLoading,
    pageSize: CONCEPTS_PAGE_SIZE,
    selected,
    setConceptFilter,
    setConceptPage,
    setGraphDepth,
    totalPages,
  }
}
