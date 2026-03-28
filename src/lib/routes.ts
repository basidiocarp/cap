export function memoriesHref(params?: { q?: string; review?: 'active' | 'all' | 'invalidated' | 'stale'; topic?: string }) {
  const search = new URLSearchParams()

  if (params?.q) search.set('q', params.q)
  if (params?.topic) search.set('topic', params.topic)
  if (params?.review && params.review !== 'all') search.set('review', params.review)

  const query = search.toString()
  return query ? `/memories?${query}` : '/memories'
}

export function memoirsHref(params?: { concept?: string; depth?: string; filter?: string; memoir?: string; page?: number }) {
  const search = new URLSearchParams()

  if (params?.memoir) search.set('memoir', params.memoir)
  if (params?.concept) search.set('concept', params.concept)
  if (params?.filter) search.set('filter', params.filter)
  if (params?.page && params.page > 1) search.set('page', String(params.page))
  if (params?.depth && params.depth !== '2') search.set('depth', params.depth)

  const query = search.toString()
  return query ? `/memoirs?${query}` : '/memoirs'
}

export function symbolSearchHref(q?: string) {
  if (!q) return '/symbols'
  const search = new URLSearchParams({ q })
  return `/symbols?${search.toString()}`
}

export function codeExplorerHref(params?: { file?: string; filter?: string; mode?: 'all' | 'exports'; symbol?: string }) {
  const search = new URLSearchParams()

  if (params?.file) search.set('file', params.file)
  if (params?.symbol) search.set('symbol', params.symbol)
  if (params?.filter) search.set('filter', params.filter)
  if (params?.mode && params.mode !== 'all') search.set('mode', params.mode)

  const query = search.toString()
  return query ? `/code?${query}` : '/code'
}

export function sessionsHref(params?: { detail?: 'latest'; session?: string }) {
  const search = new URLSearchParams()

  if (params?.session) search.set('session', params.session)
  if (params?.detail === 'latest') search.set('detail', params.detail)

  const query = search.toString()
  return query ? `/sessions?${query}` : '/sessions'
}

export function canopyHref(params?: { q?: string; status?: string; task?: string }) {
  const search = new URLSearchParams()

  if (params?.task) search.set('task', params.task)
  if (params?.q) search.set('q', params.q)
  if (params?.status && params.status !== 'all') search.set('status', params.status)

  const query = search.toString()
  return query ? `/canopy?${query}` : '/canopy'
}
