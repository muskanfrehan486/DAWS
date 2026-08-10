import {
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    Check,
  } from 'lucide-react';
  import { useState } from 'react';
  
  type NotificationType =
    | 'action'
    | 'approved'
    | 'revision';
  
  type Notification = {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    documentId: string;
    time: string;
    date: string;
    unread: boolean;
  };
  
  const initialNotifications: Notification[] = [
    {
      id: '1',
      type: 'action',
      title: 'Action Required',
      message:
        'Document DOC-2025-0122 has been assigned to you for review.',
      documentId: 'DOC-2025-0122',
      time: '2d ago',
      date: '2025-01-22 11:35',
      unread: true,
    },
    {
      id: '2',
      type: 'approved',
      title: 'Approved',
      message:
        'Vendor Contract — Tech Solutions Ltd. has been fully approved by all parties.',
      documentId: 'DOC-2025-0115',
      time: '4h ago',
      date: '2025-01-24 09:01',
      unread: true,
    },
    {
      id: '3',
      type: 'revision',
      title: 'Revision Requested',
      message:
        'Revision requested for Employee Handbook Q1 2025 by Marcus Thompson.',
      documentId: 'DOC-2025-0118',
      time: '1d ago',
      date: '2025-01-23 10:16',
      unread: true,
    },
    {
      id: '4',
      type: 'approved',
      title: 'Approved',
      message:
        'Procurement Policy Amendment No. 7 has been approved by all approvers.',
      documentId: 'DOC-2025-0109',
      time: '5d ago',
      date: '2025-01-18 15:21',
      unread: false,
    },
  ];
  
  const notificationStyles = {
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
  };
  
  function NotificationCard({
    notification,
    onOpen,
  }: {
    notification: Notification;
    onOpen: (documentId: string) => void;
  }) {
    const style = notificationStyles[notification.type];
    const Icon = style.icon;
  
    return (
      <article
        className={`
          relative
          bg-white
          border
          border-blue-200
          rounded-xl
          shadow-sm
          hover:shadow-md
          transition-shadow
          overflow-hidden
          ${notification.unread ? 'bg-white' : ''}
        `}
      >
        {/* Unread indicator */}
        {notification.unread && (
          <span
            className="
              absolute
              top-4
              right-4
              w-2
              h-2
              rounded-full
              bg-blue-600
            "
          />
        )}
  
        <div
          className="
            p-4
            sm:p-5
            flex
            gap-3
            sm:gap-4
          "
        >
          {/* Notification Icon */}
          <div
            className={`
              w-9
              h-9
              sm:w-10
              sm:h-10
              rounded-xl
              ${style.iconBg}
              flex
              items-center
              justify-center
              flex-shrink-0
            `}
          >
            <Icon
              size={17}
              className={style.iconColor}
            />
          </div>
  
          {/* Content */}
          <div className="flex-1 min-w-0 pr-5">
            {/* Type + Time */}
            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-1
                sm:gap-3
              "
            >
              <div className="flex items-center gap-2">
                <span
                  className={`
                    inline-flex
                    px-2
                    py-1
                    rounded
                    text-[10px]
                    sm:text-xs
                    font-medium
                    ${style.badgeBg}
                    ${style.badgeColor}
                  `}
                >
                  {notification.title}
                </span>
  
                {notification.unread && (
                  <span
                    className="
                      w-1.5
                      h-1.5
                      rounded-full
                      bg-blue-600
                      sm:hidden
                    "
                  />
                )}
              </div>
  
              {/* Time */}
              <div
                className="
                  flex
                  flex-col
                  sm:items-end
                  gap-0.5
                  sm:flex-shrink-0
                "
              >
                <span
                  className="
                    text-[11px]
                    sm:text-xs
                    text-slate-500
                    font-medium
                  "
                >
                  {notification.time}
                </span>
  
                <span
                  className="
                    text-[9px]
                    sm:text-[10px]
                    text-slate-300
                  "
                >
                  {notification.date}
                </span>
              </div>
            </div>
  
            {/* Message */}
            <p
              className="
                mt-2
                text-xs
                sm:text-sm
                leading-relaxed
                text-slate-700
              "
            >
              {notification.message}
            </p>
  
            {/* Document Link */}
            <button
              type="button"
              onClick={() =>
                onOpen(notification.documentId)
              }
              className="
                mt-2
                text-xs
                sm:text-sm
                text-blue-600
                hover:text-blue-700
                font-medium
                transition-colors
              "
            >
              View {notification.documentId} →
            </button>
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
    const [notifications, setNotifications] = useState(
      initialNotifications,
    );
  
    const [activeTab, setActiveTab] = useState<
      'all' | 'unread'
    >('all');
  
    const unreadCount = notifications.filter(
      notification => notification.unread,
    ).length;
  
    const filteredNotifications =
      activeTab === 'unread'
        ? notifications.filter(
            notification => notification.unread,
          )
        : notifications;
  
    const markAllAsRead = () => {
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          unread: false,
        })),
      );
    };
  
    const handleOpenDocument = (documentId: string) => {
      onOpenDocument?.(documentId);
  
      // Later this could navigate to:
      // /documents/:id
    };
  
    return (
      <main
        className="
          w-full
          max-w-[720px]
          mx-auto
          px-3
          sm:px-6
          py-4
          sm:py-6
        "
      >
        {/* Header */}
        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-start
            sm:justify-between
            gap-4
          "
        >
          {/* Title */}
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="
                  text-xl
                  sm:text-2xl
                  font-bold
                  text-slate-900
                "
              >
                Notifications
              </h1>
  
              {/* Unread count */}
              {unreadCount > 0 && (
                <span
                  className="
                    min-w-6
                    h-6
                    px-1.5
                    rounded-full
                    bg-blue-600
                    text-white
                    text-xs
                    font-semibold
                    flex
                    items-center
                    justify-center
                  "
                >
                  {unreadCount}
                </span>
              )}
            </div>
  
            <p
              className="
                text-xs
                sm:text-sm
                text-slate-500
                mt-1
              "
            >
              Stay updated on document status and
              required actions
            </p>
          </div>
  
          {/* Mark all as read */}
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="
              self-start
              inline-flex
              items-center
              justify-center
              gap-2
              min-h-[38px]
              px-3
              sm:px-4
              rounded-lg
              border
              border-blue-200
              bg-blue-50/30
              text-blue-600
              text-xs
              sm:text-sm
              font-medium
              hover:bg-blue-50
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition-colors
            "
          >
            <Check size={15} />
  
            Mark all as read
          </button>
        </div>
  
        {/* Tabs */}
        <div
          className="
            mt-5
            sm:mt-6
            border-b
            border-slate-200
          "
        >
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`
                relative
                px-4
                sm:px-5
                pb-3
                text-xs
                sm:text-sm
                font-medium
                transition-colors
                ${
                  activeTab === 'all'
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              All ({notifications.length})
  
              {activeTab === 'all' && (
                <span
                  className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-0.5
                    bg-blue-600
                  "
                />
              )}
            </button>
  
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`
                relative
                px-4
                sm:px-5
                pb-3
                text-xs
                sm:text-sm
                font-medium
                transition-colors
                ${
                  activeTab === 'unread'
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              Unread ({unreadCount})
  
              {activeTab === 'unread' && (
                <span
                  className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-0.5
                    bg-blue-600
                  "
                />
              )}
            </button>
          </div>
        </div>
  
        {/* Notifications */}
        <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
          {filteredNotifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onOpen={handleOpenDocument}
            />
          ))}
        </div>
  
        {/* Empty state */}
        {filteredNotifications.length === 0 && (
          <div
            className="
              bg-white
              border
              border-slate-200
              rounded-xl
              py-12
              px-5
              text-center
              mt-4
            "
          >
            <div
              className="
                w-12
                h-12
                mx-auto
                rounded-xl
                bg-emerald-50
                flex
                items-center
                justify-center
              "
            >
              <CheckCircle2
                size={24}
                className="text-emerald-600"
              />
            </div>
  
            <h2
              className="
                mt-3
                text-sm
                font-semibold
                text-slate-800
              "
            >
              You're all caught up
            </h2>
  
            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              There are no unread notifications.
            </p>
          </div>
        )}
      </main>
    );
  }