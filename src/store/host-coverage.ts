import { create } from 'zustand'
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware'

import type { EcosystemStatus } from '../lib/api'
import type { HostCoverageMode } from '../lib/host-coverage-view'
import { getHostCoverageView } from '../lib/host-coverage-view'

export interface HostCoverageState {
  mode: HostCoverageMode
}

export interface HostCoverageActions {
  resetMode: () => void
  setMode: (mode: HostCoverageMode) => void
}

export type HostCoverageStore = HostCoverageState & HostCoverageActions

export type { HostCoverageMode } from '../lib/host-coverage-view'

export interface HostCoverageSummary {
  color: string
  detail: string
  label: string
}

const FALLBACK_STORAGE = {
  getItem: () => null,
  removeItem: () => {},
  setItem: () => {},
}

const hostCoverageStorage = createJSONStorage<HostCoverageState>(() => {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage as Storage
  }

  return FALLBACK_STORAGE
})

export function summarizeHostCoverage(mode: HostCoverageMode, status: EcosystemStatus): HostCoverageSummary {
  const view = getHostCoverageView(status, mode)
  const color = view.effectiveMode === 'claude' ? 'grape' : view.effectiveMode === 'codex' ? 'mycelium' : 'gray'

  return {
    color,
    detail: view.detail,
    label: view.label,
  }
}

export const useHostCoverageStore = create<HostCoverageStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        mode: 'auto',
        resetMode: () => {
          set({ mode: 'auto' })
        },
        setMode: (mode) => {
          set({ mode })
        },
      }),
      {
        name: 'cap-host-coverage',
        partialize: (state) => ({ mode: state.mode }),
        storage: hostCoverageStorage,
      }
    )
  )
)
