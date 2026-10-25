import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto {
    @IsOptional()
    @IsString()
    project_name?: string;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;
}