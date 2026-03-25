import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

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

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react')
  cleanup()
})
