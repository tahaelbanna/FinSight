import { Expose, Type } from 'class-transformer';

export class DepartmentComparisonInfo {
    @Expose()
    department_id: string;

    @Expose()
    department_name: string;
}

export class DepartmentComparisonResponseDto {
    @Expose()
    @Type(() => DepartmentComparisonInfo)
    department: DepartmentComparisonInfo;

    /**
     * Period spend: actual approved expenses for this department in active date range.
     */
    @Expose()
    totalApproved: number;

    /**
     * Full authorized budget allocation for this department (Model B OpEx + CapEx).
     * Preserved intact across date filter changes; never artificially prorated.
     */
    @Expose()
    allocatedBudget: number;

    /**
     * Utilization percentage of authorized budget by period spend. Null if budget is 0.
     */
    @Expose()
    utilizationPercentage: number | null;

    /**
     * Flag indicating whether period spending exceeds the authorized budget.
     */
    @Expose()
    isOverrun: boolean;
}
