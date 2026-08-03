import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import { setAuthToken } from './services/authApi.ts';
import Administration from './pages/AdminPage';
import AppShell from './components/AppShell.tsx';
import type { UserRole } from './types/user.ts';

export type Page =
  | 'dashboard'
  | 'my-documents'
  | 'pending-approvals'
  | 'submit-document'
  | 'document-details'
  | 'notifications'
  | 'audit-trail'
  | 'administration'
  | 'profile';

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
      default:
        return null;
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
