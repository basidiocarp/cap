import { get, post } from './http'

export interface StatuslineSegment {
  name: string
  enabled: boolean
  color: string | null
  separator: string | null
  line: 1 | 2
}

export interface StatuslineConfig {
  segments: StatuslineSegment[]
  separator: string
  config_path: string
  exists: boolean
}

export interface StatuslineSaveResult {
  ok: boolean
  error?: string
}

export const statuslineApi = {
  get: () => get<StatuslineConfig>('/statusline'),
  save: (config: Omit<StatuslineConfig, 'config_path' | 'exists'>) => post<StatuslineSaveResult>('/statusline', config),
}
