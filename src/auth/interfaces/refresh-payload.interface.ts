import { UserRole } from 'src/common/enums';

export interface RefreshPayload {
    sub: string;
    role: UserRole;
    type: string;
}