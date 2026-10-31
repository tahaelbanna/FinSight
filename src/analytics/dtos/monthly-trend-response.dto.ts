import { Expose } from 'class-transformer';

export class MonthlyTrendResponseDto {
    @Expose() 
    month: string;
    
    @Expose() 
    total: number;
}