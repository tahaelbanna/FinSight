import { NotificationType, ExpenseStatus } from '../../../common/enums';
import { SEED_MARKER } from '../constants/seed-data.constants';

export interface SeedNotificationRaw {
    user_id: string;
    type: NotificationType;
    expense_id: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: Date;
    read_at: Date | null;
}

export interface ExpenseRecord {
    expense_id: string;
    user_id: string;
    status: ExpenseStatus;
    reviewed_at: Date | null;
}

export function generateSeedNotifications(
    reviewedExpenses: ExpenseRecord[],
): SeedNotificationRaw[] {
    const notifications: SeedNotificationRaw[] = [];

    for (let i = 0; i < reviewedExpenses.length; i++) {
        const exp = reviewedExpenses[i];
        if (exp.status === ExpenseStatus.PENDING || !exp.reviewed_at) {
            continue;
        }

        const isApproved = exp.status === ExpenseStatus.APPROVED;
        const type = isApproved
            ? NotificationType.EXPENSE_APPROVED
            : NotificationType.EXPENSE_REJECTED;

        const title = isApproved
            ? 'Expense Request Approved'
            : 'Expense Request Rejected';

        const body = isApproved
            ? `Your expense #${exp.expense_id} was reviewed and approved. ${SEED_MARKER}`
            : `Your expense #${exp.expense_id} was reviewed and rejected. Please see reviewer feedback. ${SEED_MARKER}`;

        // ~75% read, 25% unread
        const isRead = i % 4 !== 0;
        const createdAt = new Date(exp.reviewed_at.getTime() + 1000 * 60 * 5); // 5 mins after review
        const readAt = isRead
            ? new Date(createdAt.getTime() + 1000 * 60 * 60 * 2)
            : null;

        notifications.push({
            user_id: exp.user_id,
            type,
            expense_id: exp.expense_id,
            title,
            body,
            is_read: isRead,
            created_at: createdAt,
            read_at: readAt,
        });
    }

    return notifications;
}
