export function calculateBudgetMetrics(allocatedAmount: number, totalApproved: number) {
    const remaining_budget = allocatedAmount - totalApproved;
    const utilization_percentage = Number(((totalApproved / allocatedAmount) * 100).toFixed(2));
    const is_overrun = remaining_budget < 0;
    
    let utilization_level = 'low';
    if (is_overrun) utilization_level = 'over';
    else if (utilization_percentage >= 85) utilization_level = 'high';
    else if (utilization_percentage >= 50) utilization_level = 'moderate';

    return {
        approved_expenses: totalApproved,
        remaining_budget,
        utilization_percentage,
        budget_variance: remaining_budget, 
        utilization_level,
        is_overrun,
    };
}