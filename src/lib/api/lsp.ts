import type { LspInstallResult, LspStatusResult } from '../types'
import { get, post } from './http'

export const lspApi = {
  install: (language: string) => post<LspInstallResult>('/lsp/install', { language }),
  status: () => get<LspStatusResult>('/lsp/status'),
}
