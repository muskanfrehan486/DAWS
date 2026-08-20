import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout, AdminOnly, HomeRedirect } from './components/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards'
import LoginPage from './pages/LoginPage'
import Administration from './pages/AdminPage'
import DocumentPage from './pages/DocumentPage'
import PendingApproval from './pages/PendingApproval'
import SubmitDocument from './pages/SubmitDocument'
import Notifications from './pages/Notifications'
import AuditTrail from './pages/AuditPage'
import DocumentDetail from './pages/DocDetailPage'
import { ROUTES } from './types/routes'

export type { Page } from './types/routes'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path={ROUTES.dashboard} element={<DocumentPage />} />
            <Route
              path={ROUTES.pendingApprovals}
              element={<PendingApproval />}
            />
            <Route
              path={ROUTES.submitDocument}
              element={<SubmitDocument />}
            />
            <Route
              path={ROUTES.notifications}
              element={<Notifications />}
            />
            <Route path={ROUTES.auditTrail} element={<AuditTrail />} />
            <Route
              path={ROUTES.administration}
              element={
                <AdminOnly>
                  <Administration />
                </AdminOnly>
              }
            />
            <Route path="/documents/:id" element={<DocumentDetail />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </AuthProvider>
  )
}
