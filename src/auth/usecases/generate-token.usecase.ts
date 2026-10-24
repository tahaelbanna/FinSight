import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class GenerateTokensUseCase {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) {}

    async execute(
        payload: JwtPayload,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow<string>('jwt.jwtSecret'),
            expiresIn: this.configService.getOrThrow<string>(
                'jwt.accessTokenExpireIn',
            ) as any,
        });

        const refreshToken = await this.jwtService.signAsync(
            { sub: payload.sub, role: payload.role, type: 'refresh' },
            {
                secret: this.configService.getOrThrow<string>(
                    'jwt.jwtSecret',
                ),
                expiresIn: this.configService.getOrThrow<string>(
                    'jwt.refreshTokenExpireIn',
                ) as any,
            },
        );

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.refreshTokenRepository.delete({ user_id: payload.sub });

        await this.refreshTokenRepository.create({
            user_id: payload.sub,
            token_hash: hashedRefreshToken,
            expires_at: expiresAt,
        });

        return { accessToken, refreshToken };
    }
}
