import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../guards/jwt-auth.guard';
import { CurrentUserData, IPrincipal } from '../interfaces/principal.interface';
import { UserRole } from 'src/common/enums';

export class Principal implements IPrincipal {
    constructor(
        public user: CurrentUserData,
        public role: UserRole,
    ) {}
}

export const CurrentUser = createParamDecorator(
    (data: unknown, context: ExecutionContext): Principal | null => {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        if (!request || !request.principal) {
            return null;
        }
        const { user, role } = request.principal;
        return new Principal(user, role);
    },
);