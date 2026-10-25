import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsDateString } from 'class-validator';

export class CreateBudgetDto {
    @IsOptional()
    @IsString()
    department_id?: string;

    @IsOptional()
    @IsString()
    project_id?: string;

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    allocated_amount: number;

    @IsNotEmpty()
    @IsDateString()
    start_date: string;

    @IsNotEmpty()
    @IsDateString()
    end_date: string;
}