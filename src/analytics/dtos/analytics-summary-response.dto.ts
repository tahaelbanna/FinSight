import { Expose } from 'class-transformer';

export class AnalyticsSummaryResponseDto {
    /**
     * Full authorized budget allocation for the relevant scope (Model B OpEx + CapEx).
     * Preserved intact across date filter changes; never artificially prorated.
     */
    @Expose()
    total_budget: number;

    /**
     * Period spend: actual approved expenses matching the active date filters.
     */
    @Expose()
    total_approved_expenses: number;

    /**
     * Pending claims submitted within the active date filters.
     */
    @Expose()
    total_pending_expenses: number;

    /**
     * Remaining balance: full authorized budget minus period approved spend.
     */
    @Expose()
    remaining_budget: number;

    /**
     * Utilization rate of authorized budget by period approved spend.
     */
    @Expose()
    utilization_percentage: number;
}
