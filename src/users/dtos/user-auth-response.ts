import { UserRole } from 'src/common/enums';
import { Expose, Type } from 'class-transformer';

export class DepartmentSummaryDto {
    @Expose()
    department_id: string;

    @Expose()
    department_name: string;
}

export class UserAuthResponseDto {
    @Expose()
    user_id: string;

    @Expose()
    full_name: string;

    @Expose()
    email: string;

    @Expose()
    role: UserRole;

    @Expose()
    @Type(() => DepartmentSummaryDto)
    department: DepartmentSummaryDto | null;

    @Expose()
    is_active: boolean;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;

    @Expose()
    password_hash: string;
}
