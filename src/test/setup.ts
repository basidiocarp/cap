import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'

import { useHostCoverageStore } from '../store/host-coverage'
import { useProjectContextStore } from '../store/project-context'

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  })
}

if (typeof globalThis !== 'undefined' && !('ResizeObserver' in globalThis)) {
  class ResizeObserverMock implements ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  }

  globalThis.ResizeObserver = ResizeObserverMock
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

beforeEach(() => {
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    window.localStorage.clear()
  }

  useHostCoverageStore.getState().resetMode()
  useProjectContextStore.getState().clearProjectContext()
})

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react')
  cleanup()
})
