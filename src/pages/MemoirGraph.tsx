import { useEffect, useState } from 'react'

import { hyphaeApi } from '../lib/api'
import { MemoirGraphPage } from './memoir-graph/MemoirGraphPage'

export function MemoirGraph() {
  const [memoirNames, setMemoirNames] = useState<string[]>([])

  useEffect(() => {
    hyphaeApi
      .memoirs()
      .then((memoirs) => setMemoirNames(memoirs.map((m) => m.name)))
      .catch(console.error)
  }, [])

  return <MemoirGraphPage memoirNames={memoirNames} />
}
