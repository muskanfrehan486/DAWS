import type { NotificationsListResponse } from '../types/notification'
import { authHeaders } from './authApi'

async function parseApiError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return body?.message || body?.error || `Request failed (${res.status})`
}

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

export async function markNotificationAsRead(notificationId: string) {
  const res = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json()
}

export async function markAllNotificationsAsRead(notificationIds: string[]) {
  await Promise.all(notificationIds.map(id => markNotificationAsRead(id)))
}
