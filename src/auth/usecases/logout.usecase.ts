import { Injectable } from '@nestjs/common';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

@Injectable()
export class LogoutUseCase {
    constructor(
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) {}

    async execute(userId: string): Promise<void> {
        await this.refreshTokenRepository.delete({ user_id: userId });
    }
}