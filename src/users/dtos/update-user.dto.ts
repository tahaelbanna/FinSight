import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { UserRole } from '../../common/enums';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    full_name?: string;

    @IsOptional()
    @IsEnum(UserRole, { message: 'Invalid role' })
    role?: UserRole;

    @ValidateIf((o: UpdateUserDto) => 
        o.role === UserRole.EMPLOYEE || o.role === UserRole.MANAGER
    )
    @IsOptional()
    @IsString()
    department_id?: string;
}