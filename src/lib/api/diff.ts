import { get } from './http'

export interface DiffResponse {
  diff: string
  file: string
}

export const diffApi = {
  getFileDiff: (file: string, base?: string) =>
    get<DiffResponse>('/diff', {
      base: base ?? 'HEAD',
      file,
    }),
}
