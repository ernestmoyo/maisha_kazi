import { BellOff, CheckCheck } from 'lucide-react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import type { Notification } from '@/api/notifications';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageWrapper from '@/components/layout/PageWrapper';
import { formatRelativeTime } from '@/utils/formatters';

/* ---------- type-to-label map ---------- */
const TYPE_LABELS: Record<string, string> = {
  JOB_ASSIGNED: 'Job Assigned',
  JOB_COMPLETED: 'Job Completed',
  JOB_REQUEST: 'New Job Request',
  JOB_CANCELLED: 'Job Cancelled',
  DISPUTE_RAISED: 'Dispute Raised',
  DISPUTE_RESOLVED: 'Dispute Resolved',
  PAYMENT_RECEIVED: 'Payment Received',
};

/* ---------- dot colour per type ---------- */
function dotColor(type: string): string {
  const map: Record<string, string> = {
    JOB_ASSIGNED: 'bg-sky-500',
    JOB_COMPLETED: 'bg-emerald-500',
    JOB_REQUEST: 'bg-blue-500',
    JOB_CANCELLED: 'bg-red-500',
    DISPUTE_RAISED: 'bg-red-600',
    DISPUTE_RESOLVED: 'bg-purple-500',
    PAYMENT_RECEIVED: 'bg-amber-500',
  };
  return map[type] ?? 'bg-stone-400';
}

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsRead = useMarkAsRead();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <li
      onClick={handleClick}
      className={`
        flex items-start gap-3 px-4 py-3.5 cursor-pointer
        transition-colors duration-150
        first:rounded-t-xl last:rounded-b-xl
        ${notification.isRead
          ? 'bg-white hover:bg-stone-50'
          : 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary'}
      `}
    >
      {/* Type dot */}
      <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${dotColor(notification.type)}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-body font-semibold text-dark-subtle uppercase tracking-wide mb-0.5">
          {TYPE_LABELS[notification.type] ?? notification.type.replace(/_/g, ' ')}
        </p>
        <p className="text-sm font-body text-dark leading-snug">
          {notification.message}
        </p>
        <p className="text-xs font-body text-dark-subtle mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </li>
  );
}

export default function Notifications() {
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <PageWrapper title="Notifications" subtitle="Stay up to date">
        <div className="max-w-2xl mx-auto space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <LoadingSkeleton key={i} variant="table-row" />
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Notifications" subtitle="Stay up to date">
      <div className="max-w-2xl mx-auto">
        {/* Header row */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-body text-dark-subtle">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : 'All caught up'}
            </p>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                isLoading={markAllAsRead.isPending}
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck size={14} />
                Mark all read
              </Button>
            )}
          </div>
        )}

        {notifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={BellOff}
              title="No notifications"
              description="You're all caught up. Notifications will appear here."
            />
          </Card>
        ) : (
          <div className="rounded-xl ring-1 ring-stone-200 divide-y divide-stone-100 overflow-hidden">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
