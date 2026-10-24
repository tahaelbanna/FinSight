import { UserRole } from 'src/common/enums';

export interface JwtPayload {
    sub: string; // user_id
    email: string;
    role: UserRole;
    department_id?: string | null;
}