import React, { useState } from 'react';
import { useNotifications, useMarkNotificationAsRead } from './hooks/useNotifications';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/feedback/Toast';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { showSuccess } = useToast();
  const [page, setPage] = useState(1);
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data, isLoading, error } = useNotifications({
    page,
    limit: 10,
    isRead: readFilter === 'all' ? undefined : readFilter === 'read',
  });

  const markAsReadMutation = useMarkNotificationAsRead();

  const notifications = data?.data || [];
  const meta = data?.meta;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync(id);
      showSuccess('Notification marked as read');
    } catch {
      // Handled by global interceptor if needed
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900">
            System Notifications
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Real-time updates on expense approvals, budget alerts, and platform events
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-stone-200 shadow-xs w-fit">
        <button
          onClick={() => {
            setReadFilter('all');
            setPage(1);
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            readFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => {
            setReadFilter('unread');
            setPage(1);
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            readFilter === 'unread'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => {
            setReadFilter('read');
            setPage(1);
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            readFilter === 'read'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Read
        </button>
      </div>

      {/* Notifications List */}
      <Card className="overflow-hidden border border-stone-200 shadow-xs bg-white">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-stone-500">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            Failed to load notifications. Please try again.
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-900">
              No notifications
            </h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
              You are completely caught up! No notifications match the selected filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {notifications.map((notif) => {
              const isApproved = notif.type === 'expense_approved';
              return (
                <div
                  key={notif.notification_id}
                  className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                    !notif.is_read
                      ? 'bg-indigo-50/40'
                      : 'hover:bg-stone-50/60'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900">
                          {notif.title}
                        </h4>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(notif.created_at)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-stone-600 leading-relaxed">
                      {notif.body}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <Badge variant={isApproved ? 'success' : 'danger'} className="text-[10px]">
                        {isApproved ? 'Claim Approved' : 'Claim Rejected'}
                      </Badge>

                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.notification_id)}
                          disabled={markAsReadMutation.isPending}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark as read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {meta && (
          <div className="p-4 bg-white border-t border-stone-100">
            <Pagination
              meta={meta}
              currentPage={page}
              onPageChange={(p) => setPage(p)}
              isLoading={isLoading}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
