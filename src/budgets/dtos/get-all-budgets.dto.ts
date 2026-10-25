import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { BudgetScopeFilter } from '../../common/enums';

export class GetAllBudgetsDto extends PaginationDto {
    @IsOptional()
    @IsEnum(BudgetScopeFilter)
    scope?: BudgetScopeFilter;

    @IsOptional()
    @IsString()
    department_id?: string;

    @IsOptional()
    @IsString()
    project_id?: string;

    @IsOptional()
    @IsDateString()
    date_from?: string;

    @IsOptional()
    @IsDateString()
    date_to?: string;

    // TODO: سيتم تفعيله لاحقاً مع موديول المصروفات
    // @IsOptional()
    // @Transform(({ value }) => value === 'true' || value === true)
    // @IsBoolean()
    // is_overrun?: boolean; 
}