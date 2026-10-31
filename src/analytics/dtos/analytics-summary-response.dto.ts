import { Expose } from 'class-transformer';

export class AnalyticsSummaryResponseDto {
    @Expose()
    total_budget: number;

    @Expose()
    total_approved_expenses: number;

    @Expose()
    total_pending_expenses: number;

    @Expose()
    remaining_budget: number;

    @Expose()
    utilization_percentage: number;
}
