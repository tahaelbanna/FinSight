import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/data-access';
import { RefreshToken } from '../schemas/refresh-token.schema';

@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {
        super(refreshTokenRepository);
    }
}
