import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import { setAuthToken } from './services/authApi.ts';
import Administration from './pages/AdminPage';
import UserDashboard from './pages/UserDashboard';
import AppShell from './components/AppShell.tsx';
import type { UserRole } from './types/user.ts';
import DocumentPage from './pages/DocumentPage.tsx';
import PendingApproval from './pages/PendingApproval.tsx';
import SubmitDocument from './pages/SubmitDocument.tsx';
import Notifications from './pages/Notifications.tsx';
import AuditTrail from './pages/AuditPage.tsx';

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
  const [activePage, setActivePage] = useState<Page>('dashboard');
  // const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const handleNavigate = (page: Page) => { 
    setActivePage(page);
  };

  const handleLogin = (userRole: UserRole) => {
    setLoggedIn(true);
    setActivePage(userRole === 'ADMINISTRATOR' ? 'administration' : 'dashboard');
  };

  // const handleOpenDocument = (docId: string) => {
  //   setSelectedDocId(docId);
  //   setActivePage('document-details');
  // };

  const handleLogout = () => {
    setAuthToken(null);
    setLoggedIn(false);
    setActivePage('dashboard');
  };

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
            onOpenDocument={() => {}}
          />
        );
        case 'my-documents':
          return (
            <DocumentPage
              onNavigate={handleNavigate}
              onOpenDocument={() => {}}
            />
          );
        case 'pending-approvals':
          return (
            <PendingApproval
            onOpenDocument={() => {}}
            />
          );
        case 'submit-document':
          return (
            <SubmitDocument
            />
          );
        case 'notifications':
          return (
            <Notifications
              onOpenDocument={() => {}}
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
    <AppShell
      activePage={activePage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      showSidebar={showSidebar}
    >
      {renderPage()}
    </AppShell>
  );
}
