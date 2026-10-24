import { UserRole } from 'src/common/enums';

export interface CurrentUserData {
    user_id: string;
    full_name: string;
    email: string;
    department_id?: string | null;
}

export interface IPrincipal {
    user: CurrentUserData;
    role: UserRole;
}