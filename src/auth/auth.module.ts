import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LogoutUseCase } from './usecases/logout.usecase';
import { RefreshTokenUseCase } from './usecases/refresh-token.usecase';
import { LoginUseCase } from './usecases/login.usecase';
import { GenerateTokensUseCase } from './usecases/generate-token.usecase';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { SystemAdminModule } from 'src/system-admin/system-admin.module';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvironmentInterface } from '../common/configuration/environment.interface';
import { RefreshToken } from './schemas/refresh-token.schema';
import { DeleteRefreshTokensForUserUseCase } from './usecases/delete-refresh.usecase';
import { forwardRef } from '@nestjs/common';

@Module({
    controllers: [AuthController],
    providers: [
        AuthService,
        LogoutUseCase,
        RefreshTokenUseCase,
        LoginUseCase,
        GenerateTokensUseCase,
        RefreshTokenRepository,
		DeleteRefreshTokensForUserUseCase
    ],
    exports: [AuthService, JwtModule],
    imports: [
        JwtModule.registerAsync({
            useFactory: (
                configService: ConfigService<EnvironmentInterface>,
            ) => ({
                secret: configService.getOrThrow('jwt.jwtSecret', {
                    infer: true,
                }),
                signOptions: {
                    expiresIn: configService.getOrThrow(
                        'jwt.accessTokenExpireIn',
                        { infer: true },
                    ) as JwtSignOptions['expiresIn'],
                },
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([RefreshToken]),
        SystemAdminModule,
		forwardRef(() => UsersModule),
    ],
})
export class AuthModule {}
