import { Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/AppLayout'
import { Analytics } from './pages/Analytics'
import { CodeExplorer } from './pages/CodeExplorer'
import { Dashboard } from './pages/Dashboard'
import { Diagnostics } from './pages/Diagnostics'
import { Memoirs } from './pages/Memoirs'
import { Memories } from './pages/Memories'
import { Status } from './pages/Status'
import { SymbolSearch } from './pages/SymbolSearch'

export function App() {
  return (
    <Routes>
      <Route
        element={<AppLayout />}
        path='/'
      >
        <Route
          element={<Dashboard />}
          index
        />
        <Route
          element={<Memories />}
          path='memories'
        />
        <Route
          element={<Memoirs />}
          path='memoirs'
        />
        <Route
          element={<Analytics />}
          path='analytics'
        />
        <Route
          element={<CodeExplorer />}
          path='code'
        />
        <Route
          element={<Diagnostics />}
          path='diagnostics'
        />
        <Route
          element={<Status />}
          path='status'
        />
        <Route
          element={<SymbolSearch />}
          path='symbols'
        />
      </Route>
    </Routes>
  )
}
