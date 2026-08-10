import type {
  ApiNotification,
  ApiNotificationType,
  NotificationItem,
  NotificationUiCategory,
} from '../types/notification'
import { formatDisplayDate, formatRelativeTime } from './format'

export function mapNotificationCategory(
  type: ApiNotificationType,
): NotificationUiCategory {
  switch (type) {
    case 'APPROVAL_NEEDED':
      return 'action'
    case 'APPROVED':
      return 'approved'
    case 'REVISION_REQUESTED':
      return 'revision'
    case 'REJECTED':
      return 'rejected'
    case 'RESUBMITTED':
      return 'submitted'
  }
}

export function mapApiNotificationToItem(
  notification: ApiNotification,
): NotificationItem {
  return {
    id: notification.id,
    category: mapNotificationCategory(notification.type),
    title: notification.title,
    message: notification.message,
    documentId: notification.documentId,
    createdAt: notification.createdAt,
    relativeTime: formatRelativeTime(notification.createdAt),
    displayDate: formatDisplayDate(notification.createdAt),
    isRead: notification.isRead,
  }
}
