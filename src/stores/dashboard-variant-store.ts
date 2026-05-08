import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DashboardVariant = 'operator' | 'confident' | 'fieldlab'

interface DashboardVariantStore {
  variant: DashboardVariant
  setVariant: (v: DashboardVariant) => void
}

export const useDashboardVariantStore = create<DashboardVariantStore>()(
  persist(
    (set) => ({
      variant: 'operator',
      setVariant: (variant) => set({ variant }),
    }),
    { name: 'dashboard-variant' },
  ),
)
