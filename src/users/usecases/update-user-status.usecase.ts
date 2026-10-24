import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { I18nService } from 'nestjs-i18n';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserRepository } from '../repositories/users.repository';
import { UpdateUserStatusDto } from '../dtos/update-user-status.dto';

@Injectable()
export class UpdateUserStatusUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        body: UpdateUserStatusDto,
        user_id: string,
        // currentUserId: string,
    ): Promise<UserResponseDto> {
        // if (currentUserId === user_id && body.is_active === false) {
        //     throw new BadRequestException(
        //         this.i18nService.translate('users.CANNOT_DEACTIVATE_OWN_ACCOUNT'),
        //     );
        // }

        const user = await this.userRepository.findById(user_id);
        if (!user) {
            throw new NotFoundException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        if (user.is_active === body.is_active) {
            const messageKey = body.is_active
                ? 'users.USER_ALREADY_ACTIVE'
                : 'users.USER_ALREADY_DEACTIVATED';
            throw new BadRequestException(
                this.i18nService.translate(messageKey),
            );
        }

        const updatedUser = await this.userRepository.updateById(
            user_id,
            { is_active: body.is_active },
        );

        if (body.is_active === false) {
            // استدعاء ميثود لحذف أو الـ Refresh Tokens لليوزر ده
        }

        return plainToInstance(UserResponseDto, updatedUser);
    }
}