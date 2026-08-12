/** Backend Prisma notification types */
export type ApiNotificationType =
  | 'APPROVAL_NEEDED'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'APPROVED'
  | 'RESUBMITTED'
  | 'DOCUMENT_DELETED'

export interface ApiNotification {
  id: string
  type: ApiNotificationType
  title: string
  message: string
  documentId: string | null
  workflowRunId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface NotificationsListResponse {
  notifications: ApiNotification[]
}

/** UI category used for icon and badge styling */
export type NotificationUiCategory =
  | 'action'
  | 'approved'
  | 'revision'
  | 'rejected'
  | 'submitted'
  | 'deleted'

export interface NotificationItem {
  id: string
  category: NotificationUiCategory
  title: string
  message: string
  documentId: string | null
  createdAt: string
  relativeTime: string
  displayDate: string
  isRead: boolean
}
