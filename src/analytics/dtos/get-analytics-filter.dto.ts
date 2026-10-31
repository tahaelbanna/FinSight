import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GetAnalyticsFilterDto {
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
}
