import { SetMetadata } from '@nestjs/common';

export const IS_ROLES_KEY = 'isRoles';
export const AllowRoles = (...roles: string[]) =>
    SetMetadata(IS_ROLES_KEY, roles);
