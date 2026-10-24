import { Injectable } from '@nestjs/common';
import { LoginUseCase } from './usecases/login.usecase';
import { LogoutUseCase } from './usecases/logout.usecase';
import { RefreshTokenUseCase } from './usecases/refresh-token.usecase';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { DeleteRefreshTokensForUserUseCase } from './usecases/delete-refresh.usecase';
@Injectable()
export class AuthService {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        private readonly deleteRefreshTokensForUser: DeleteRefreshTokensForUserUseCase,
    ) {}

    async login(body: LoginDto): Promise<AuthResponseDto> {
        return this.loginUseCase.execute(body);
    }

    async logout(userId: string): Promise<void> {
        return this.logoutUseCase.execute(userId);
    }

    async refreshToken(body: RefreshTokenDto): Promise<AuthResponseDto> {
        return this.refreshTokenUseCase.execute(body);
    }

    async DeleteRefreshTokensForUser(userId: string): Promise<void> {
        return this.deleteRefreshTokensForUser.execute(userId);
    }
}
