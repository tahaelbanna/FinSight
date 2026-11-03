import { Budget } from 'src/budgets/schemas/budget.schema';

/**
 * @deprecated
 * Linear daily budget proration has been removed from FinSight Analytics
 * in accordance with the Financial Logic Verification Report.
 * Authorized budget allocations must remain intact for the budget period,
 * and date filters apply strictly to period spend rather than artificially
 * prorating authorized allocations.
 */
export function parseDateToUtcDays(dateInput: string | Date): number {
    if (typeof dateInput === 'string') {
        const parts = dateInput.split('T')[0].split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return Math.floor(Date.UTC(year, month, day) / 86400000);
        }
    }
    const d = new Date(dateInput);
    return Math.floor(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000,
    );
}

export function calculateProratedBudget(
    budget: Budget,
    dateFrom?: string,
    dateTo?: string,
): number {
    const budgetStart = parseDateToUtcDays(budget.start_date);
    const budgetEnd = parseDateToUtcDays(budget.end_date);
    const totalBudgetDays = budgetEnd - budgetStart + 1;
    if (totalBudgetDays <= 0) return 0;

    const amount = Number(budget.allocated_amount);

    if (!dateFrom && !dateTo) {
        return amount;
    }

    if (dateFrom && dateTo) {
        const filterStart = parseDateToUtcDays(dateFrom);
        const filterEnd = parseDateToUtcDays(dateTo);
        const overlapStart = Math.max(budgetStart, filterStart);
        const overlapEnd = Math.min(budgetEnd, filterEnd);
        const overlapDays = Math.max(0, overlapEnd - overlapStart + 1);
        return overlapDays > 0 ? (amount * overlapDays) / totalBudgetDays : 0;
    }

    if (dateFrom && !dateTo) {
        const filterStart = parseDateToUtcDays(dateFrom);
        const overlapStart = Math.max(budgetStart, filterStart);
        const overlapEnd = budgetEnd;
        const overlapDays = Math.max(0, overlapEnd - overlapStart + 1);
        return overlapDays > 0 ? (amount * overlapDays) / totalBudgetDays : 0;
    }

    if (!dateFrom && dateTo) {
        const filterEnd = parseDateToUtcDays(dateTo);
        const overlapStart = budgetStart;
        const overlapEnd = Math.min(budgetEnd, filterEnd);
        const overlapDays = Math.max(0, overlapEnd - overlapStart + 1);
        return overlapDays > 0 ? (amount * overlapDays) / totalBudgetDays : 0;
    }

    return amount;
}
