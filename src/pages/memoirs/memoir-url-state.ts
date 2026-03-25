export interface MemoirUrlState {
  concept: string
  depth: string
  filter: string
  memoir: string
  page: number
}

export const DEFAULT_MEMOIR_DEPTH = '2'
export const DEFAULT_MEMOIR_PAGE = 1

export function readMemoirUrlState(searchParams: URLSearchParams): MemoirUrlState {
  const page = Number.parseInt(searchParams.get('page') ?? '', 10)

  return {
    concept: searchParams.get('concept') ?? '',
    depth: searchParams.get('depth') ?? DEFAULT_MEMOIR_DEPTH,
    filter: searchParams.get('filter') ?? '',
    memoir: searchParams.get('memoir') ?? '',
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_MEMOIR_PAGE,
  }
}

export function writeMemoirUrlState(current: URLSearchParams, state: MemoirUrlState): URLSearchParams {
  const next = new URLSearchParams(current)

  if (state.memoir) {
    next.set('memoir', state.memoir)
  } else {
    next.delete('memoir')
  }

  if (state.concept) {
    next.set('concept', state.concept)
  } else {
    next.delete('concept')
  }

  if (state.filter) {
    next.set('filter', state.filter)
  } else {
    next.delete('filter')
  }

  if (state.page > DEFAULT_MEMOIR_PAGE) {
    next.set('page', String(state.page))
  } else {
    next.delete('page')
  }

  if (state.depth && state.depth !== DEFAULT_MEMOIR_DEPTH) {
    next.set('depth', state.depth)
  } else {
    next.delete('depth')
  }

  return next
}

export function memoirUrlStatesEqual(left: MemoirUrlState, right: MemoirUrlState): boolean {
  return (
    left.concept === right.concept &&
    left.depth === right.depth &&
    left.filter === right.filter &&
    left.memoir === right.memoir &&
    left.page === right.page
  )
}
