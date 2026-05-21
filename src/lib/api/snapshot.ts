import type { Snapshot } from '../types/snapshot'
import { get } from './http'

export const snapshotApi = {
  snapshot: () => get<Snapshot>('/snapshot'),
}
