import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { ProjectStatus } from '../../common/enums';

export class GetAllProjectsDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    department_id?: string;

    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;
}