import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AppShell from './AppShell'
import { CurrentUserProvider } from '../contexts/CurrentUserContext'
import { useAuth } from '../contexts/AuthContext'
import { useCurrentUser } from '../contexts/CurrentUserContext'
import { ROUTES } from '../types/routes'

function HomeRedirect() {
  const { user, loading } = useCurrentUser()

  if (loading) {
    return (
      <div
        className="min-h-[50vh] flex items-center justify-center"
        style={{ background: '#f0f7f2' }}
      >
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    )
  }

  if (user?.role === 'ADMINISTRATOR') {
    return <Navigate to={ROUTES.administration} replace />
  }

  return <Navigate to={ROUTES.dashboard} replace />
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser()

  if (loading) {
    return (
      <div
        className="min-h-[50vh] flex items-center justify-center"
        style={{ background: '#f0f7f2' }}
      >
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    )
  }

  if (user?.role !== 'ADMINISTRATOR') {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <>{children}</>
}

export function AppLayout() {
  const { sessionUser, sessionKey, logout } = useAuth()
  const location = useLocation()
  const showSidebar = location.pathname !== ROUTES.administration

  return (
    <CurrentUserProvider key={sessionKey} initialUser={sessionUser}>
      <AppShell onLogout={logout} showSidebar={showSidebar}>
        <Outlet />
      </AppShell>
    </CurrentUserProvider>
  )
}

export { HomeRedirect, AdminOnly }
