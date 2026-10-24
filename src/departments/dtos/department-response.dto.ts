import {Exclude, Expose, Type} from 'class-transformer';

class Manager {
    @Expose()
    manager_id: string;

    @Expose()
    manager_name: string;
}

class DepartmentUserDto {
    @Expose()
    user_id: string;

    @Expose()
    full_name: string;

    @Expose()
    email: string;

    @Expose()
    role: string;
}

export class DepartmentResponseDto {
    @Expose()
    department_id: string;

    @Expose()
    department_name: string;

    @Expose()
    description: string;

    @Expose() 
    @Type(() => Manager)
    manager: Manager | null; 

    @Expose()
    usersCount: number;

    @Expose()
    @Type(() => DepartmentUserDto)
    users?: DepartmentUserDto[];

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;
}
