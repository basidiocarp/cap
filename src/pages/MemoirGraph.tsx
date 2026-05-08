import { useMemoirs } from '../lib/queries'
import { PageLoader } from '../components/PageLoader'
import { MemoirGraphPage } from './memoir-graph/MemoirGraphPage'

export function MemoirGraph() {
  const memoirsQuery = useMemoirs()
  if (memoirsQuery.isLoading) return <PageLoader />
  const memoirNames = memoirsQuery.data?.map((m) => m.name) ?? []
  return <MemoirGraphPage memoirNames={memoirNames} />
}
