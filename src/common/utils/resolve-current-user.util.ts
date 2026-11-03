import { UnauthorizedException } from '../error-handling/custom-exceptions/unauthorized.exception';
import { UserRole } from '../enums';
import { UserRepository } from '../../users/repositories/users.repository';

export interface ResolvedUser {
    user_id: string;
    role: UserRole;
    department_id: string | null;
}

export async function resolveCurrentUser(
    userRepository: UserRepository,
    user_id: string,
    role?: UserRole,
    errorMessage: string = 'User not found',
): Promise<ResolvedUser> {
    if (role === UserRole.ADMIN) {
        return {
            user_id,
            role: UserRole.ADMIN,
            department_id: null,
        };
    }

    const user = await userRepository.findById(user_id);
    if (!user) {
        throw new UnauthorizedException(errorMessage);
    }

    return {
        user_id: user.user_id,
        role: role || user.role,
        department_id: user.department_id,
    };
}
