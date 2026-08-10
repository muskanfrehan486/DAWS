import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Check,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDocumentId } from '../utils/format';
import type { NotificationItem, NotificationUiCategory } from '../types/notification';

const notificationStyles: Record<
  NotificationUiCategory,
  {
    icon: typeof AlertCircle;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeColor: string;
  }
> = {
  action: {
    icon: AlertCircle,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-50',
    badgeColor: 'text-blue-600',
  },
  approved: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeColor: 'text-emerald-600',
  },
  revision: {
    icon: RotateCcw,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    badgeBg: 'bg-violet-50',
    badgeColor: 'text-violet-600',
  },
  rejected: {
    icon: XCircle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-50',
    badgeColor: 'text-red-600',
  },
  submitted: {
    icon: FileText,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    badgeBg: 'bg-slate-100',
    badgeColor: 'text-slate-600',
  },
};

function NotificationCard({
  notification,
  onOpen,
  onMarkRead,
}: {
  notification: NotificationItem;
  onOpen: (documentId: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const style = notificationStyles[notification.category];
  const Icon = style.icon;

  const handleOpen = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (notification.documentId) {
      onOpen(notification.documentId);
    }
  };

  return (
    <article
      className={`relative bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
        notification.isRead ? 'border-slate-200' : 'border-blue-200'
      }`}
    >
      {!notification.isRead && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-600" />
      )}

      <div className="p-4 sm:p-5 flex gap-3 sm:gap-4">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${style.iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={17} className={style.iconColor} />
        </div>

        <div className="flex-1 min-w-0 pr-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex px-2 py-1 rounded text-[10px] sm:text-xs font-medium ${style.badgeBg} ${style.badgeColor}`}
              >
                {notification.title}
              </span>

              {!notification.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 sm:hidden" />
              )}
            </div>

            <div className="flex flex-col sm:items-end gap-0.5 sm:flex-shrink-0">
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                {notification.relativeTime}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-300">
                {notification.displayDate}
              </span>
            </div>
          </div>

          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-700">
            {notification.message}
          </p>

          {notification.documentId && (
            <button
              type="button"
              onClick={handleOpen}
              className="mt-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View {formatDocumentId(notification.documentId)} →
            </button>
          )}

          {!notification.isRead && (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              className="mt-2 ml-3 text-xs text-slate-500 hover:text-slate-700"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Notifications({
  onOpenDocument,
}: {
  onOpenDocument?: (documentId: string) => void;
}) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    actionLoading,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter(notification => !notification.isRead)
      : notifications;

  const handleMarkAllAsRead = async () => {
    setActionError(null);
    try {
      await markAllAsRead();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to mark all as read',
      );
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setActionError(null);
    try {
      await markAsRead(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to mark as read',
      );
    }
  };

  const handleOpenDocument = (documentId: string) => {
    onOpenDocument?.(documentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <main className="w-full max-w-[720px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="min-w-6 h-6 px-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay updated on document status and required actions
          </p>
        </div>

        <button
          type="button"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0 || actionLoading}
          className="self-start inline-flex items-center justify-center gap-2 min-h-[38px] px-3 sm:px-4 rounded-lg border border-blue-200 bg-blue-50/30 text-blue-600 text-xs sm:text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {actionLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Check size={15} />
          )}
          Mark all as read
        </button>
      </div>

      {actionError && (
        <p className="mt-3 text-sm text-red-600">{actionError}</p>
      )}

      <div className="mt-5 sm:mt-6 border-b border-slate-200">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`relative px-4 sm:px-5 pb-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All ({notifications.length})
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`relative px-4 sm:px-5 pb-3 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'unread'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Unread ({unreadCount})
            {activeTab === 'unread' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      {filteredNotifications.length > 0 && (
        <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
          {filteredNotifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onOpen={handleOpenDocument}
              onMarkRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}

      {filteredNotifications.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl py-12 px-5 text-center mt-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-600" />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-slate-800">
            {notifications.length === 0
              ? 'No notifications yet'
              : "You're all caught up"}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {activeTab === 'unread'
              ? 'There are no unread notifications.'
              : 'Notifications will appear here when workflow events occur.'}
          </p>
        </div>
      )}
    </main>
  );
}
