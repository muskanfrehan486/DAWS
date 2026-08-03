import { useState } from 'react';
import LoginPage from './pages/LoginPage';
// import Dashboard from './pages/Dashboard';
// import MyDocuments from './pages/MyDocuments';
// import PendingApprovals from './pages/PendingApprovals';
// import SubmitDocument from './pages/SubmitDocument';
// import DocumentDetails from './pages/DocumentDetails';
// import Notifications from './pages/Notifications';
// import AuditTrail from './pages/AuditTrail';
// import Reports from './pages/Reports';
import Administration from './pages/AdminPage';
import AppShell from './components/AppShell.tsx';

export type Page =
  | 'dashboard'
  | 'my-documents'
  | 'pending-approvals'
  | 'submit-document'
  | 'document-details'
  | 'notifications'
  | 'audit-trail'
  // | 'reports'
  | 'administration'
  | 'profile';

type UserRole = 'administrator' | 'user';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  // const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  // for testing:
  // const [loggedIn, setLoggedIn] = useState(true);
  // const [activePage, setActivePage] = useState<Page>('administration');

  const handleNavigate = (page: Page) => { 
    setActivePage(page);
  };

  const handleLogin = (userRole: UserRole) => {
    setLoggedIn(true);
    setActivePage(userRole === 'administrator' ? 'administration' : 'dashboard');
  };

  // const handleOpenDocument = (docId: string) => {
  //   setSelectedDocId(docId);
  //   setActivePage('document-details');
  // };

  const handleLogout = () => {
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
