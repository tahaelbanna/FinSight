import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FindOptionsWhere } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserRepository } from '../repositories/users.repository';
import { User } from '../schemas/users.schema';
import { UserAuthResponseDto } from '../dtos/user-auth-response';

@Injectable()
export class GetOneUserUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(query: FindOptionsWhere<User>): Promise<UserAuthResponseDto> {
        const user = await this.userRepository.findOne({
            where: query,
            relations: { department: true },
        });

        if (!user) return null;

        return plainToInstance(UserAuthResponseDto, user);
    }
}
