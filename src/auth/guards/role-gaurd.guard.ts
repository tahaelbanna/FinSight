import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_ROLES_KEY } from '../decorators/roles.decorator';
import { RequestWithUser } from './jwt-auth.guard';
import { ForbiddenException } from '../../common/error-handling/custom-exceptions/forbidden.exception';
import { UserRole } from 'src/common/enums';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly i18nService: I18nService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) return true;

        const roles = this.reflector.getAllAndOverride<UserRole[]>(IS_ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!roles || roles.length === 0) return true;

        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const principal = request.principal;
        const requestRole = principal?.role;

        const canAccess = roles.includes(requestRole);
        if (!canAccess) {
            throw new ForbiddenException(
                await this.i18nService.translate('auth.FORBIDDEN'),
            );
        }

        return true;
    }
}