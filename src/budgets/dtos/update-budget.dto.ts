import { IsDateString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateBudgetDto {
    @IsOptional()
    @IsNumber()
    @IsPositive()
    allocated_amount?: number;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;
}