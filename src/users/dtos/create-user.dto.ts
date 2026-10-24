import { IsEmail, IsNotEmpty, IsEnum, ValidateIf, IsOptional, IsString } from 'class-validator';
import { UserRole } from 'src/common/enums';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    full_name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password_hash: string;

    @IsNotEmpty()
    @IsEnum(UserRole, { message: 'Invalid role' })
    role: UserRole;

    @ValidateIf((o: CreateUserDto) => 
        o.role === UserRole.EMPLOYEE || o.role === UserRole.MANAGER
    )
    @IsNotEmpty({ message: 'departmentId is required for employees and managers' })
    @IsString()
    department_id: string;
}
