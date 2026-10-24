import { Injectable } from '@nestjs/common';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserRepository } from '../repositories/users.repository';
import { UserRole } from '../../common/enums';

@Injectable()
export class UpdateUserUsecase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        body: UpdateUserDto,
        user_id: string,
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
        return plainToInstance(UserResponseDto, updatedUser);
    }
}
