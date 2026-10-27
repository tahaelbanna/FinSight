import { IsEnum, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ExpenseStatus } from 'src/common/enums';
import { ExpenseSortBy, SortOrder } from 'src/common/enums';

export class GetAllExpensesDto extends PaginationDto {
    @IsOptional()
    @IsEnum(ExpenseStatus)
    status?: ExpenseStatus;

    @IsOptional()
    @IsString()
    category_id?: string;

    @IsOptional()
    @IsString()
    department_id?: string;

    @IsOptional()
    @IsString()
    project_id?: string;

    @IsOptional()
    @IsString()
    submitted_by?: string;

    @IsOptional()
    @IsDateString()
    date_from?: string;

    @IsOptional()
    @IsDateString()
    date_to?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    min_amount?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    max_amount?: number;

    @IsOptional()
    @IsEnum(ExpenseSortBy)
    sort_by?: ExpenseSortBy;

    @IsOptional()
    @IsEnum(SortOrder)
    sort_order?: SortOrder;
}