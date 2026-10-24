import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { plainToInstance } from 'class-transformer';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';
import { UsersService } from 'src/users/users.service';
import { SystemAdminService } from 'src/system-admin/system-admin.service';
import { GenerateTokensUseCase } from './generate-token.usecase';
import { LoginDto } from '../dtos/login.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { UserRole } from 'src/common/enums';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private readonly systemAdminService: SystemAdminService,
        private readonly generateTokensUseCase: GenerateTokensUseCase,
        private readonly i18nService: I18nService,
    ) {}

    async execute(body: LoginDto): Promise<AuthResponseDto> {
        const normalizedEmail = body.email
            ? body.email.toLowerCase().trim()
            : '';

        const systemAdmin = await this.systemAdminService.getSystemAdmin({
            email: normalizedEmail,
        });

        if (systemAdmin) {
            if (systemAdmin.deleted_at) {
                throw new UnauthorizedException(
                    await this.i18nService.translate(
                        'auth.INVALID_CREDENTIALS',
                    ),
                );
            }

            const isPasswordValid = await bcrypt.compare(
                body.password,
                systemAdmin.password_hash,
            );

            if (!isPasswordValid) {
                throw new UnauthorizedException(
                    await this.i18nService.translate(
                        'auth.INVALID_CREDENTIALS',
                    ),
                );
            }

            const tokens = await this.generateTokensUseCase.execute({
                sub: systemAdmin.admin_id,
                email: systemAdmin.email,
                role: UserRole.ADMIN,
                department_id: null,
            });

            return plainToInstance(AuthResponseDto, tokens);
        }

        const user = await this.usersService.getOne({ email: normalizedEmail });
        
        if (!user) {
            throw new UnauthorizedException(
                await this.i18nService.translate('auth.INVALID_CREDENTIALS'),
            );
        }
        
        if (user) {
            const isUserPasswordValid = await bcrypt.compare(
                body.password,
                user.password_hash,
            );

            if (!isUserPasswordValid) {
                throw new UnauthorizedException(
                    await this.i18nService.translate(
                        'auth.INVALID_CREDENTIALS',
                    ),
                );
            }

            if (!user.is_active) {
                throw new ForbiddenException(
                    await this.i18nService.translate(
                        'auth.ACCOUNT_DEACTIVATED',
                    ),
                );
            }

            const tokens = await this.generateTokensUseCase.execute({
                sub: user.user_id,
                email: user.email,
                role: user.role,
                department_id: user.department?.department_id ?? null,
            });

            return plainToInstance(AuthResponseDto, tokens);
        }
    }
}
