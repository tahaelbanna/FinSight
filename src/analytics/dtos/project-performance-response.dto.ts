import { Expose } from 'class-transformer';

export class ProjectPerformanceResponseDto {
    @Expose() 
    project_id: string;
    
    @Expose() 
    project_name: string;
    
    /**
     * Full authorized CapEx budget allocation for this project.
     * Preserved intact across date filter changes; never artificially prorated.
     */
    @Expose() 
    allocated_budget: number;
    
    /**
     * Period spend: actual approved expenses for this project in active date range.
     */
    @Expose() 
    total_spent: number;
    
    /**
     * Remaining CapEx balance: authorized budget minus period approved spend.
     */
    @Expose() 
    remaining_budget: number;
    
    /**
     * Utilization rate of project authorized CapEx budget by period approved spend.
     */
    @Expose() 
    utilization_percentage: number;
}