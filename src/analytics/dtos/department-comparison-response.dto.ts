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

    @Expose()
    totalApproved: number;

    @Expose()
    allocatedBudget: number;

    @Expose()
    utilizationPercentage: number | null;

    @Expose()
    isOverrun: boolean;
}
