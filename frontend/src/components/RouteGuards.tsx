import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../types/routes'

export function ProtectedRoute() {
  const { authChecked, loggedIn } = useAuth()

  if (!authChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#f0f7f2' }}
      >
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    )
  }

  if (!loggedIn) {
    return <Navigate to={ROUTES.login} replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { authChecked, loggedIn } = useAuth()

  if (!authChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#f0f7f2' }}
      >
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    )
  }

  if (loggedIn) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <Outlet />
}
