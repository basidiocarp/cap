import { Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/AppLayout'
import { Analytics } from './pages/Analytics'
import { Dashboard } from './pages/Dashboard'
import { Memoirs } from './pages/Memoirs'
import { Memories } from './pages/Memories'

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
      </Route>
    </Routes>
  )
}
