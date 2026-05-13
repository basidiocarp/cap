import { createFileRoute } from '@tanstack/react-router'

import { SymbolSearchPage } from '../pages/symbol-search/SymbolSearchPage'

export const Route = createFileRoute('/symbols')({
  component: SymbolSearchPage,
})
