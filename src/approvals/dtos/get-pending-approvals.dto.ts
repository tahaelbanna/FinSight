import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ExpenseSortBy, SortOrder } from 'src/common/enums';

export class GetPendingApprovalsDto extends PaginationDto {
    @IsOptional()
    @IsString()
    category_id?: string;

    @IsOptional()
    @IsString()
    project_id?: string;

    @IsOptional()
    @IsEnum(ExpenseSortBy)
    sort_by?: ExpenseSortBy;

    @IsOptional()
    @IsEnum(SortOrder)
    sort_order?: SortOrder;
}