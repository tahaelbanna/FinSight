// departments/dtos/update-department.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto {
    @IsOptional()
    @IsString()
    department_name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    manager_id?: string;
}