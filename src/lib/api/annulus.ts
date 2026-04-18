import type { AnnulusStatus } from '../types'
import { get } from './http'

export const annulusApi = {
  status: () => get<AnnulusStatus>('/ecosystem/status'),
}
