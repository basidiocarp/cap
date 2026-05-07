import type { AnnulusStatus } from '../types'
import type { ResolvedStatusCustomization } from '../types/annulus'
import { get } from './http'

export const annulusApi = {
  configExport: () => get<ResolvedStatusCustomization | null>('/ecosystem/config'),
  status: () => get<AnnulusStatus>('/ecosystem/status'),
}
