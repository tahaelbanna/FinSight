import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateExpenseDto {
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    amount: number;

    @IsNotEmpty()
    @IsDateString()
    expense_date: string;

    @IsNotEmpty()
    @IsString()
    category_id: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    department_id: string;

    @IsOptional()
    @IsString()
    project_id?: string;
}