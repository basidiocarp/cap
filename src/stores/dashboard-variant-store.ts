import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DashboardVariant = 'operator' | 'confident' | 'fieldlab'
export type AccentColor = 'mycelium' | 'spore' | 'substrate' | 'gill'

interface DashboardVariantStore {
  variant: DashboardVariant
  setVariant: (v: DashboardVariant) => void
  accentColor: AccentColor
  setAccentColor: (c: AccentColor) => void
  compactDensity: boolean
  setCompactDensity: (c: boolean) => void
}

export const useDashboardVariantStore = create<DashboardVariantStore>()(
  persist(
    (set) => ({
      accentColor: 'mycelium',
      compactDensity: false,
      setAccentColor: (accentColor) => set({ accentColor }),
      setCompactDensity: (compactDensity) => set({ compactDensity }),
      setVariant: (variant) => set({ variant }),
      variant: 'operator',
    }),
    { name: 'dashboard-variant' }
  )
)
