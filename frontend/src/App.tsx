import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import { getAuthToken, restoreSession, setAuthToken } from './services/authApi.ts';
import Administration from './pages/AdminPage';
import UserDashboard from './pages/UserDashboard';
import AppShell from './components/AppShell.tsx';
import type { UserRole } from './types/user.ts';
import DocumentPage from './pages/DocumentPage.tsx';
import PendingApproval from './pages/PendingApproval.tsx';
import SubmitDocument from './pages/SubmitDocument.tsx';
import Notifications from './pages/Notifications.tsx';
import AuditTrail from './pages/AuditPage.tsx';
import DocumentDetail from './pages/DocDetailPage.tsx';
import { CurrentUserProvider, type CurrentUser } from './contexts/CurrentUserContext.tsx';

export type Page =
  | 'dashboard'
  | 'my-documents'
  | 'pending-approvals'
  | 'submit-document'
  | 'document-details'
  | 'notifications'
  | 'audit-trail'
  | 'administration'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [returnPage, setReturnPage] = useState<Page>('my-documents');
  const [sessionUser, setSessionUser] = useState<CurrentUser | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    if (!getAuthToken()) {
      setAuthChecked(true);
      return;
    }

    restoreSession()
      .then(user => {
        if (user) {
          setLoggedIn(true);
          setSessionUser(user);
          setActivePage(user.role === 'ADMINISTRATOR' ? 'administration' : 'dashboard');
        }
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleNavigate = (page: Page) => { 
    setActivePage(page);
  };

  const handleOpenDocument = (docId: string) => {
    setReturnPage(activePage);
    setSelectedDocId(docId);
    setActivePage('document-details');
  };

  const handleCloseDocument = () => {
    setSelectedDocId(null);
    setActivePage(returnPage);
  };

  const handleLogin = (userRole: UserRole) => {
    setLoggedIn(true);
    setSessionUser(null);
    setSessionKey(key => key + 1);
    setActivePage(userRole === 'ADMINISTRATOR' ? 'administration' : 'dashboard');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setLoggedIn(false);
    setSessionUser(null);
    setActivePage('dashboard');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f3f6fb' }}>
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'administration':
        return <Administration />;
      case 'dashboard':
        return (
          <UserDashboard
            onNavigate={handleNavigate}
            onOpenDocument={handleOpenDocument}
          />
        );
        case 'my-documents':
          return (
            <DocumentPage
              onNavigate={handleNavigate}
              onOpenDocument={handleOpenDocument}
            />
          );
        case 'pending-approvals':
          return (
            <PendingApproval
              onOpenDocument={handleOpenDocument}
            />
          );
        case 'submit-document':
          return (
            <SubmitDocument onNavigate={handleNavigate} />
          );
        case 'notifications':
          return (
            <Notifications
              onOpenDocument={handleOpenDocument}
            />
          );
        case 'document-details':
          if (!selectedDocId) {
            return null;
          }
          return (
            <DocumentDetail
              documentId={selectedDocId}
              returnPage={returnPage}
              onNavigate={handleNavigate}
              onBack={handleCloseDocument}
            />
          );
        case 'audit-trail':
          return (
            <AuditTrail
            />
          );
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <p className="text-slate-500 text-sm">This page is coming soon.</p>
          </div>
        );
    }
  };

  const showSidebar = activePage !== 'administration';

  return (
    <CurrentUserProvider key={sessionKey} initialUser={sessionUser}>
      <AppShell
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        showSidebar={showSidebar}
      >
        {renderPage()}
      </AppShell>
    </CurrentUserProvider>
  );
}
