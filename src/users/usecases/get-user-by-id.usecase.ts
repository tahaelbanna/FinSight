import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserRepository } from '../repositories/users.repository';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class GetUserByIdUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(user_id: string): Promise<UserResponseDto> {
        const user = await this.userRepository.findOne({
            where: { user_id },
            relations: {
                department: true,
            },
        });

        if (!user) {
            throw new NotFoundException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        return plainToInstance(UserResponseDto, user);
    }
}
