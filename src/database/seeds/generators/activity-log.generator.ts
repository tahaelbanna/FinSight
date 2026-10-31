import { ActionType, EntityType, ExpenseStatus } from '../../../common/enums';

export interface SeedActivityLogRaw {
    user_id: string;
    action_type: ActionType;
    entity_type: EntityType;
    entity_id: string;
    created_at: Date;
}

export interface ExpenseEventContext {
    expense_id: string;
    user_id: string;
    status: ExpenseStatus;
    reviewer_id: string | null;
    submitted_at: Date;
    reviewed_at: Date | null;
}

export function generateSeedActivityLogs(params: {
    systemAdminId: string;
    financeOfficerId: string;
    userIds: string[];
    departmentIds: string[];
    projectIds: string[];
    budgetIds: string[];
    expenses: ExpenseEventContext[];
}): SeedActivityLogRaw[] {
    const {
        systemAdminId,
        financeOfficerId,
        userIds,
        departmentIds,
        projectIds,
        budgetIds,
        expenses,
    } = params;

    const logs: SeedActivityLogRaw[] = [];

    // 1. User Lifecycle Events
    // 35 USER_CREATED
    for (const uid of userIds) {
        logs.push({
            user_id: systemAdminId,
            action_type: ActionType.USER_CREATED,
            entity_type: EntityType.USER,
            entity_id: uid,
            created_at: new Date('2024-01-02T08:00:00Z'),
        });
    }

    // 6 USER_UPDATED (historical role or title adjustments)
    for (let i = 0; i < 6 && i < userIds.length; i++) {
        logs.push({
            user_id: systemAdminId,
            action_type: ActionType.USER_UPDATED,
            entity_type: EntityType.USER,
            entity_id: userIds[i],
            created_at: new Date('2024-06-15T11:30:00Z'),
        });
    }

    // 3 USER_DEACTIVATED (the 3 inactive employees)
    for (let i = 0; i < 3 && i < userIds.length; i++) {
        logs.push({
            user_id: systemAdminId,
            action_type: ActionType.USER_DEACTIVATED,
            entity_type: EntityType.USER,
            entity_id: userIds[userIds.length - 1 - i],
            created_at: new Date('2025-08-01T16:00:00Z'),
        });
    }

    // 1 USER_ACTIVATED (re-activation after temporary leave)
    if (userIds.length > 5) {
        logs.push({
            user_id: systemAdminId,
            action_type: ActionType.USER_ACTIVATED,
            entity_type: EntityType.USER,
            entity_id: userIds[5],
            created_at: new Date('2025-09-01T09:00:00Z'),
        });
    }

    // 2. Department Events
    // 6 DEPARTMENT_CREATED
    for (const did of departmentIds) {
        logs.push({
            user_id: systemAdminId,
            action_type: ActionType.DEPARTMENT_CREATED,
            entity_type: EntityType.DEPARTMENT,
            entity_id: did,
            created_at: new Date('2024-01-02T08:30:00Z'),
        });
    }

    // 4 DEPARTMENT_UPDATED (description / metadata updates)
    for (let i = 0; i < 4 && i < departmentIds.length; i++) {
        logs.push({
            user_id: systemAdminId,
            action_type: ActionType.DEPARTMENT_UPDATED,
            entity_type: EntityType.DEPARTMENT,
            entity_id: departmentIds[i],
            created_at: new Date('2024-11-20T14:00:00Z'),
        });
    }

    // DEPARTMENT_DELETED = 0 (clean production model preserves all 6 departments)

    // 3. Project Events
    // 18 PROJECT_CREATED
    for (const pid of projectIds) {
        logs.push({
            user_id: systemAdminId,
            action_type: ActionType.PROJECT_CREATED,
            entity_type: EntityType.PROJECT,
            entity_id: pid,
            created_at: new Date('2024-01-10T10:00:00Z'),
        });
    }

    // 24 PROJECT_UPDATED (milestone & status transitions)
    for (let i = 0; i < 24; i++) {
        const pid = projectIds[i % projectIds.length];
        logs.push({
            user_id: systemAdminId,
            action_type: ActionType.PROJECT_UPDATED,
            entity_type: EntityType.PROJECT,
            entity_id: pid,
            created_at: new Date(`2024-12-${String((i % 20) + 1).padStart(2, '0')}T15:00:00Z`),
        });
    }

    // 4. Budget Events
    // 54 BUDGET_CREATED
    for (const bid of budgetIds) {
        logs.push({
            user_id: financeOfficerId,
            action_type: ActionType.BUDGET_CREATED,
            entity_type: EntityType.BUDGET,
            entity_id: bid,
            created_at: new Date('2024-01-05T09:00:00Z'),
        });
    }

    // 12 BUDGET_UPDATED (annual reallocation & review adjustments)
    for (let i = 0; i < 12 && i < budgetIds.length; i++) {
        logs.push({
            user_id: financeOfficerId,
            action_type: ActionType.BUDGET_UPDATED,
            entity_type: EntityType.BUDGET,
            entity_id: budgetIds[i],
            created_at: new Date('2025-06-30T10:30:00Z'),
        });
    }

    // 5. Expense Events
    for (const exp of expenses) {
        // Every expense has an EXPENSE_SUBMITTED log (2,800)
        logs.push({
            user_id: exp.user_id,
            action_type: ActionType.EXPENSE_SUBMITTED,
            entity_type: EntityType.EXPENSE,
            entity_id: exp.expense_id,
            created_at: exp.submitted_at,
        });

        // Reviewed expenses have an approval or rejection log (1,960 + 420)
        if (exp.status === ExpenseStatus.APPROVED && exp.reviewer_id && exp.reviewed_at) {
            logs.push({
                user_id: exp.reviewer_id,
                action_type: ActionType.EXPENSE_APPROVED,
                entity_type: EntityType.EXPENSE,
                entity_id: exp.expense_id,
                created_at: exp.reviewed_at,
            });
        } else if (exp.status === ExpenseStatus.REJECTED && exp.reviewer_id && exp.reviewed_at) {
            logs.push({
                user_id: exp.reviewer_id,
                action_type: ActionType.EXPENSE_REJECTED,
                entity_type: EntityType.EXPENSE,
                entity_id: exp.expense_id,
                created_at: exp.reviewed_at,
            });
        }
    }

    return logs;
}
