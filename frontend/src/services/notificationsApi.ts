import type { NotificationsListResponse } from '../types/notification'
import { authHeaders } from './authApi'
import { parseApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/requestCache'

export async function fetchNotifications(
  isRead?: boolean,
): Promise<NotificationsListResponse> {
  const params = new URLSearchParams()
  if (isRead !== undefined) {
    params.set('isRead', String(isRead))
  }

  const query = params.toString()
  const url = query ? `/api/notifications?${query}` : '/api/notifications'

  const res = await fetch(url, {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<NotificationsListResponse>
}

async function fetchUnreadNotifications(): Promise<NotificationsListResponse> {
  return fetchNotifications(false)
}

const unreadNotificationsCache = createCachedRequest(fetchUnreadNotifications, 4000)

export function fetchUnreadNotificationsCached(
  force = false,
): Promise<NotificationsListResponse> {
  return unreadNotificationsCache.get(force)
}

export function invalidateUnreadNotificationsCache(): void {
  unreadNotificationsCache.invalidate()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('daws:unread-notifications-changed'))
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const res = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  invalidateUnreadNotificationsCache()
  return res.json()
}

export async function markAllNotificationsAsRead(notificationIds: string[]) {
  await Promise.all(notificationIds.map(id => markNotificationAsRead(id)))
}

export async function deleteNotification(notificationId: string) {
  const res = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  invalidateUnreadNotificationsCache()
  return res.json() as Promise<{ message: string }>
}
