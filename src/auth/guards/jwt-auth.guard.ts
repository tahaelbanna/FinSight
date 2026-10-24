import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { I18nService } from 'nestjs-i18n';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { CurrentUserData, IPrincipal } from '../interfaces/principal.interface';
import { UsersService } from 'src/users/users.service';
import { SystemAdminService } from '../../system-admin/system-admin.service';
import { UserRole } from 'src/common/enums';
import { Inject, forwardRef } from '@nestjs/common';

export type RequestWithUser = Request & {
    principal: IPrincipal;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private readonly reflector: Reflector,
        private readonly i18nService: I18nService,
        private readonly systemAdminService: SystemAdminService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const authHeader = request.headers['authorization'];
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;

        if (!token) {
            throw new UnauthorizedException(
                await this.i18nService.translate('auth.UNAUTHORIZED'),
            );
        }

        try {
            const payload: JwtPayload = this.jwtService.verify(token);
            const currentAccount: IPrincipal =
                await this.buildCurrentUser(payload);
            request.principal = currentAccount;
        } catch {
            throw new UnauthorizedException(
                await this.i18nService.translate('auth.INVALID_TOKEN'),
            );
        }

        return true;
    }

    private async buildCurrentUser(payload: JwtPayload): Promise<IPrincipal> {
        let userData: CurrentUserData;

        if (payload.role === UserRole.ADMIN) {
            const admin = await this.systemAdminService.getSystemAdmin({
                admin_id: payload.sub,
            });

            if (!admin || admin.deleted_at) {
                throw new UnauthorizedException(
                    await this.i18nService.translate('auth.INVALID_TOKEN'),
                );
            }

            userData = {
                user_id: admin.admin_id,
                full_name: admin.name,
                email: admin.email,
                department_id: null,
            };
        } else {
            const user = await this.usersService.getOne({
                user_id: payload.sub,
            });

            if (!user) {
                throw new UnauthorizedException(
                    await this.i18nService.translate('auth.INVALID_TOKEN'),
                );
            }

            userData = {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                department_id: user.department?.department_id ?? null,
            };
        }

        return {
            user: userData,
            role: payload.role,
        };
    }
}
