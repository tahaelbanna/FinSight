import { Expose, Type } from 'class-transformer';

export class BudgetAllocationMetricDto {
    @Expose()
    total_budget: number;

    @Expose()
    total_approved_spend: number;

    @Expose()
    remaining_budget: number;

    @Expose()
    utilization_percentage: number;

    @Expose()
    total_budgets_count: number;

    @Expose()
    is_overrun?: boolean;
}

export class BudgetSummaryResponseDto {
    @Expose()
    @Type(() => BudgetAllocationMetricDto)
    all_allocations: BudgetAllocationMetricDto;

    @Expose()
    @Type(() => BudgetAllocationMetricDto)
    department_opex: BudgetAllocationMetricDto;

    @Expose()
    @Type(() => BudgetAllocationMetricDto)
    project_capex: BudgetAllocationMetricDto;
}
