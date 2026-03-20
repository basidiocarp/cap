import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageLoader } from './components/PageLoader'
import { Dashboard } from './pages/Dashboard'

const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })))
const CodeExplorer = lazy(() => import('./pages/CodeExplorer').then((m) => ({ default: m.CodeExplorer })))
const Diagnostics = lazy(() => import('./pages/Diagnostics').then((m) => ({ default: m.Diagnostics })))
const Lessons = lazy(() => import('./pages/Lessons').then((m) => ({ default: m.Lessons })))
const Memoirs = lazy(() => import('./pages/Memoirs').then((m) => ({ default: m.Memoirs })))
const Memories = lazy(() => import('./pages/Memories').then((m) => ({ default: m.Memories })))
const Sessions = lazy(() => import('./pages/Sessions').then((m) => ({ default: m.Sessions })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const Status = lazy(() => import('./pages/Status').then((m) => ({ default: m.Status })))
const SymbolSearch = lazy(() => import('./pages/SymbolSearch').then((m) => ({ default: m.SymbolSearch })))

export function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
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
              element={<Sessions />}
              path='sessions'
            />
            <Route
              element={<Lessons />}
              path='lessons'
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
              element={<Settings />}
              path='settings'
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
      </Suspense>
    </ErrorBoundary>
  )
}
