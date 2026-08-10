import { type ReactNode, useEffect, useState } from 'react';
import {
  LayoutDashboard, FileText, Clock, Upload, Bell, ClipboardList, LogOut, ChevronDown, Search, Menu, X, Settings,
} from 'lucide-react';
import { getMe } from '../services/authApi';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { usePendingApprovals } from '../hooks/usePendingApprovals';
import type { Page } from '../App';

interface AppShellProps {
  children: ReactNode;
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  showSidebar?: boolean;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard; dividerBefore?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-documents', label: 'My Documents', icon: FileText },
  { id: 'pending-approvals', label: 'Pending Approvals', icon: Clock },
  { id: 'submit-document', label: 'Submit Document', icon: Upload },
  { id: 'notifications', label: 'Notifications', icon: Bell, dividerBefore: true },
  { id: 'audit-trail', label: 'Audit Trail', icon: ClipboardList },
//   { id: 'reports', label: 'Reports', icon: BarChart2 },
];

export default function AppShell({ children, activePage, onNavigate, onLogout, showSidebar = true }: AppShellProps) {
  const [searchValue, setSearchValue] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
      getMe()
          .then(setCurrentUser)
          .catch(console.error);
  }, []);

  const { unreadCount: notificationUnreadCount } = useUnreadNotificationCount();
  const { documents: pendingDocuments } = usePendingApprovals();
  const pendingCount = pendingDocuments.length;
  const isAdmin = currentUser?.role === 'ADMINISTRATOR';
  const userInitials = currentUser
    ? `${currentUser.firstName?.[0] ?? ''}${currentUser.lastName?.[0] ?? ''}`.toUpperCase()
    : '??';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}>
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-[13px] leading-tight">DocFlow</div>
            <div className="text-slate-400 text-[10px] leading-tight">Workflow Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const badge = item.id === 'pending-approvals' ? pendingCount :
                        item.id === 'notifications' ? notificationUnreadCount : 0;
          return (
            <div key={item.id}>
              {item.dividerBefore && (
                <div className="my-2 border-t border-white/10" />
              )}
              <button
                onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                className={`sidebar-nav-item w-full text-left ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white min-w-[18px] text-center leading-none">
                    {badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom profile */}
      <div className="px-3 py-3 border-t border-white/10 flex-shrink-0 space-y-0.5">
        {isAdmin && (
          <button
            onClick={() => { onNavigate('administration'); setMobileOpen(false); }}
            className={`sidebar-nav-item w-full text-left ${activePage === 'administration' ? 'active' : ''}`}
          >
            <Settings size={16} />
            <span>Administration</span>
          </button>
        )}
        {/* <button
          onClick={() => { onNavigate('profile' as Page); setMobileOpen(false); }}
          className="sidebar-nav-item w-full text-left"
        >
          <User size={16} />
          <span>Profile</span>
        </button> */}
        <button
          onClick={onLogout}
          className="sidebar-nav-item w-full text-left hover:bg-red-500/20 hover:text-red-400"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f3f6fb' }}>
      {/* Desktop sidebar — hidden below lg breakpoint */}
      {showSidebar && (
        <aside
          className="hidden lg:flex flex-col w-60 flex-shrink-0"
          style={{ background: '#1b2333' }}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile drawer — only when hamburger is tapped */}
      {showSidebar && mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside
            className="absolute inset-y-0 left-0 w-64 flex flex-col shadow-xl"
            style={{ background: '#1b2333' }}
          >
            <button
              type="button"
              className="absolute top-4 right-3 z-10 text-slate-400 hover:text-white p-1"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden main-content-offset">
        {/* Topbar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-slate-200 flex items-center px-3 sm:px-5 gap-2 sm:gap-4 z-10">
            {showSidebar && (
            <button
              type="button"
              className="inline-flex lg:hidden items-center justify-center w-9 h-9 flex-shrink-0 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          )}

          {/* Search */}
          <div className="flex-1 max-w-sm relative min-w-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search documents..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-3 ml-auto flex-shrink-0">
            {/* Notification bell */}
            {showSidebar && (
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {notificationUnreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-white" />
              )}
            </button>)}

            {/* User */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-1.5 sm:px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}
                >
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">{currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : 'Loading...'}</div>
                  <div className="text-[10px] text-slate-400 leading-tight capitalize">
                    {currentUser?.role?.toLowerCase() ?? ''}
                  </div>
                </div>
                <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-semibold text-slate-800">{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Loading..."}</div>
                    <div className="text-[10px] text-slate-400">{currentUser?.email}</div>
                  </div>
                  {/* {showSidebar && (
                    <button className="w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                      <User size={13} /> Profile Settings
                    </button>
                  )} */}
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
