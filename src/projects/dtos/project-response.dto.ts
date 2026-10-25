import { ProjectStatus } from '../../common/enums';
import { Expose, Type } from 'class-transformer';

export class Department {
    @Expose()
    department_id: string;
    
    @Expose()
    department_name: string;
}

export class ProjectResponseDto {
    @Expose()
    project_id: string;
    
    @Expose()
    project_name: string;
    
    @Expose()
    @Type(() => Department)
    department: Department;
    
    @Expose()
    start_date: Date;
    
    @Expose()
    end_date: Date;
    
    @Expose()
    status: ProjectStatus;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;
}
