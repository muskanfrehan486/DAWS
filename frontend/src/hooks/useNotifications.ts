import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationsApi'
import type { NotificationItem } from '../types/notification'
import { mapApiNotificationToItem } from '../utils/notificationMapper'

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { notifications: apiNotifications } = await fetchNotifications()
      setNotifications(apiNotifications.map(mapApiNotificationToItem))
    } catch (err) {
      setNotifications([])
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.isRead).length,
    [notifications],
  )

  const markAsRead = useCallback(async (notificationId: string) => {
    const target = notifications.find(n => n.id === notificationId)
    if (!target || target.isRead) return

    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    )

    try {
      await markNotificationAsRead(notificationId)
    } catch {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: false }
            : notification,
        ),
      )
      throw new Error('Failed to mark notification as read')
    }
  }, [notifications])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter(notification => !notification.isRead)
      .map(notification => notification.id)

    if (unreadIds.length === 0) return

    setActionLoading(true)

    const previous = notifications
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true })),
    )

    try {
      await markAllNotificationsAsRead(unreadIds)
    } catch {
      setNotifications(previous)
      throw new Error('Failed to mark all notifications as read')
    } finally {
      setActionLoading(false)
    }
  }, [notifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    actionLoading,
    refetch: load,
    markAsRead,
    markAllAsRead,
  }
}

export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    try {
      const { notifications } = await fetchNotifications(false)
      setCount(notifications.length)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { unreadCount: count, refetch: load }
}
