export type AppPage =
  | 'dashboard'
  | 'pending-approvals'
  | 'submit-document'
  | 'document-details'
  | 'notifications'
  | 'audit-trail'
  | 'administration'

/** @deprecated Prefer path constants; kept for breadcrumb labels. */
export type Page = AppPage

export const ROUTES = {
  login: '/login',
  home: '/',
  dashboard: '/dashboard',
  pendingApprovals: '/pending-approvals',
  submitDocument: '/submit-document',
  notifications: '/notifications',
  auditTrail: '/audit-trail',
  administration: '/administration',
  document: (id: string) => `/documents/${id}`,
} as const

export const PAGE_LABELS: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  'pending-approvals': 'Pending Approvals',
  'submit-document': 'Submit Document',
  'document-details': 'Document',
  notifications: 'Notifications',
  'audit-trail': 'Audit Trail',
  administration: 'Administration',
}

export const NAV_PATHS: Record<
  Exclude<AppPage, 'document-details'>,
  string
> = {
  dashboard: ROUTES.dashboard,
  'pending-approvals': ROUTES.pendingApprovals,
  'submit-document': ROUTES.submitDocument,
  notifications: ROUTES.notifications,
  'audit-trail': ROUTES.auditTrail,
  administration: ROUTES.administration,
}

export function pathToPage(pathname: string): AppPage | null {
  if (pathname.startsWith('/documents/')) return 'document-details'
  if (pathname === ROUTES.dashboard) return 'dashboard'
  if (pathname === ROUTES.pendingApprovals) return 'pending-approvals'
  if (pathname === ROUTES.submitDocument) return 'submit-document'
  if (pathname === ROUTES.notifications) return 'notifications'
  if (pathname === ROUTES.auditTrail) return 'audit-trail'
  if (pathname === ROUTES.administration) return 'administration'
  return null
}
