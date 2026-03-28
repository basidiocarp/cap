import type { EcosystemStatus } from '../types'
import { get } from './http'

export const statusApi = {
  ecosystem: () => get<EcosystemStatus>('/status'),
}
