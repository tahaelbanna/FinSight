import { Expose } from 'class-transformer';

export class ProjectPerformanceResponseDto {
    @Expose() 
    project_id: string;
    
    @Expose() 
    project_name: string;
    
    @Expose() 
    allocated_budget: number;
    
    @Expose() 
    total_spent: number;
    
    @Expose() 
    remaining_budget: number;
    
    @Expose() 
    utilization_percentage: number;
}