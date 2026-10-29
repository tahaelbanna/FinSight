import { Injectable } from '@nestjs/common';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserRepository } from '../repositories/users.repository';
import { UserRole } from '../../common/enums';
import { ActionType, EntityType } from 'src/common/enums';
import { ActivityLogRepository } from 'src/activity-logs/repositories/activity-log.repository';

@Injectable()
export class UpdateUserUsecase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
        private readonly activityLogRepository: ActivityLogRepository,
    ) {}

    async execute(
        body: UpdateUserDto,
        user_id: string,
        admin_id: string,
    ): Promise<UserResponseDto> {
        const user = await this.userRepository.findById(user_id);
        if (!user) {
            throw new NotFoundException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        const finalRole = body.role ?? user.role;
        const finalDepartmentId =
            body.department_id !== undefined
                ? body.department_id
                : user.department_id;

        if (
            (finalRole === UserRole.EMPLOYEE ||
                finalRole === UserRole.MANAGER) &&
            !finalDepartmentId
        ) {
            throw new BadRequestException(
                this.i18nService.translate(
                    'users.DEPARTMENT_REQUIRED_FOR_THIS_ROLE',
                ),
            );
        }

        const updatedUser = await this.userRepository.updateById(user_id, body);

        await this.activityLogRepository.create({
            user_id: admin_id,
            action_type: ActionType.USER_UPDATED,
            entity_type: EntityType.USER,
            entity_id: user_id,
        });

        return plainToInstance(UserResponseDto, updatedUser);
    }
}
