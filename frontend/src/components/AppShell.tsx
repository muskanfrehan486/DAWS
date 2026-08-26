import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Clock,
  Upload,
  Bell,
  ClipboardList,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Settings,
} from 'lucide-react'
import { useCurrentUser } from '../contexts/CurrentUserContext'
import { useUnreadNotificationCount } from '../hooks/useNotifications'
import { NAV_PATHS, ROUTES, type AppPage } from '../types/routes'

interface AppShellProps {
  children: React.ReactNode
  onLogout: () => void
  showSidebar?: boolean
}

const NAV_ITEMS: {
  id: Exclude<AppPage, 'document-details' | 'administration'>
  label: string
  icon: typeof LayoutDashboard
  dividerBefore?: boolean
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pending-approvals', label: 'Pending Approvals', icon: Clock },
  { id: 'submit-document', label: 'Submit Document', icon: Upload },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    dividerBefore: true,
  },
  { id: 'audit-trail', label: 'Approval Log', icon: ClipboardList },
]

export default function AppShell({
  children,
  onLogout,
  showSidebar = true,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user: currentUser } = useCurrentUser()
  const navigate = useNavigate()
  const { unreadCount } = useUnreadNotificationCount()

  const isAdmin = currentUser?.role === 'ADMINISTRATOR'
  const userInitials = currentUser
    ? `${currentUser.firstName?.[0] ?? ''}${currentUser.lastName?.[0] ?? ''}`.toUpperCase()
    : '??'

  const handleLogout = () => {
    onLogout()
    navigate(ROUTES.login, { replace: true })
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
            }}
          >
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-[13px] leading-tight">
              Ideas Flow
            </div>
            <div className="text-slate-400 text-[10px] leading-tight">
              Workflow Management
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <div key={item.id}>
              {item.dividerBefore && (
                <div className="my-2 border-t border-white/10" />
              )}
              <NavLink
                to={NAV_PATHS[item.id]}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-nav-item w-full text-left ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={16} />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            </div>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/10 flex-shrink-0 space-y-0.5">
        {isAdmin && (
          <NavLink
            to={ROUTES.administration}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-nav-item w-full text-left ${isActive ? 'active' : ''}`
            }
          >
            <Settings size={16} />
            <span>Administration</span>
          </NavLink>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-left hover:bg-red-500/20 hover:text-red-400"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#f0f7f2' }}
    >
      {showSidebar && (
        <aside
          className="hidden lg:flex flex-col w-60 flex-shrink-0"
          style={{ background: '#1b2333' }}
        >
          <SidebarContent />
        </aside>
      )}

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

      <div className="flex-1 flex flex-col overflow-hidden main-content-offset">
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

          <div className="flex items-center gap-1 sm:gap-3 ml-auto flex-shrink-0">
            {showSidebar && (
              <NavLink
                to={ROUTES.notifications}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} unread`
                    : 'Notifications'
                }
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-4 text-center tabular-nums">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-1.5 sm:px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                  }}
                >
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">
                    {currentUser
                      ? `${currentUser.firstName} ${currentUser.lastName}`
                      : 'Loading...'}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight capitalize">
                    {currentUser?.role?.toLowerCase() ?? ''}
                  </div>
                </div>
                <ChevronDown
                  size={13}
                  className="text-slate-400 hidden sm:block"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-semibold text-slate-800">
                      {currentUser
                        ? `${currentUser.firstName} ${currentUser.lastName}`
                        : 'Loading...'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {currentUser?.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
