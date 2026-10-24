import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { plainToInstance } from 'class-transformer';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { GenerateTokensUseCase } from './generate-token.usecase';
import { UsersService } from 'src/users/users.service';
import { SystemAdminService } from 'src/system-admin/system-admin.service';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { UserRole } from 'src/common/enums';
import { MoreThan } from 'typeorm';
import { RefreshPayload } from '../interfaces/refresh-payload.interface';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class RefreshTokenUseCase {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private readonly systemAdminService: SystemAdminService,
        private readonly generateTokensUseCase: GenerateTokensUseCase,
        private readonly i18nService: I18nService,
    ) {}

    async execute(body: RefreshTokenDto): Promise<AuthResponseDto> {
        let payload: RefreshPayload;
        try {
            payload = await this.jwtService.verifyAsync<RefreshPayload>(
                body.refreshToken,
                {
                    secret: this.configService.getOrThrow<string>('jwt.jwtSecret'),
                },
            );
        } catch {
            throw new UnauthorizedException(
                await this.i18nService.translate('auth.INVALID_TOKEN'),
            );
        }
        if (payload.type !== 'refresh') {
            throw new UnauthorizedException(
                await this.i18nService.translate('auth.INVALID_TOKEN'),
            );
        }

        const storedTokens = await this.refreshTokenRepository.find({
            where: {
                user_id: payload.sub,
                expires_at: MoreThan(new Date()),
            },
        });

        if (!storedTokens || storedTokens.length === 0) {
            throw new UnauthorizedException(
                await this.i18nService.translate('auth.INVALID_TOKEN'),
            );
        }

        let matchedToken = null;
        for (const token of storedTokens) {
            const isMatch = await bcrypt.compare(body.refreshToken, token.token_hash);
            if (isMatch) {
                matchedToken = token;
                break;
            }
        }

        if (!matchedToken) {
            throw new UnauthorizedException(
                await this.i18nService.translate('auth.INVALID_TOKEN'),
            );
        }

        if (payload.role === UserRole.ADMIN) {
            const admin = await this.systemAdminService.getSystemAdmin({
                admin_id: payload.sub,
            });

            if (!admin || admin.deleted_at) {
                throw new UnauthorizedException(
                    await this.i18nService.translate('auth.INVALID_TOKEN'),
                );
            }

            const tokens = await this.generateTokensUseCase.execute({
                sub: admin.admin_id,
                email: admin.email,
                role: UserRole.ADMIN,
                department_id: null,
            });

            return plainToInstance(AuthResponseDto, tokens);
        }

        const user = await this.usersService.getOne({ user_id: payload.sub });

        if (!user || !user.is_active) {
            throw new UnauthorizedException(
                await this.i18nService.translate('auth.ACCOUNT_DEACTIVATED'),
            );
        }

        const tokens = await this.generateTokensUseCase.execute({
            sub: user.user_id,
            email: user.email,
            role: user.role,
            department_id: user.department?.department_id ?? user.department?.department_id ?? null,
        });

        return plainToInstance(AuthResponseDto, tokens);
    }
}