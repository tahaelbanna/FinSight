import { Expose } from 'class-transformer';

export class DepartmentComparisonResponseDto {
    @Expose() 
    department_id: string;
    
    @Expose() 
    department_name: string;
    
    @Expose() 
    total: number;
}
