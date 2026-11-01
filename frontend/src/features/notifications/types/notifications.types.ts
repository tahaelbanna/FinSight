export type NotificationType = 'expense_approved' | 'expense_rejected';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface NotificationItem {
  notification_id: string;
  type: NotificationType;
  title: string;
  body: string;
  expense_id: string;
  expenseStatus: ExpenseStatus;
  is_read: boolean;
  created_at: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}
