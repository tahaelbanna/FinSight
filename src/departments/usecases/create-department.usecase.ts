import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DepartmentRepository } from '../repositories/department.repository';
import { CreateDepartmentDto } from '../dtos/create-department.dto';
import { DepartmentResponseDto } from '../dtos/department-response.dto';
import { I18nService } from 'nestjs-i18n';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { UserRepository } from 'src/users/repositories/users.repository';
import { UserRole } from 'src/common/enums';

@Injectable()
export class CreateDepartmentUseCase {
    constructor(
        private readonly departmentRepository: DepartmentRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(body: CreateDepartmentDto): Promise<DepartmentResponseDto> {
        const existingDepartment = await this.departmentRepository.findOne({
            where: {
                department_name: body.department_name,
            },
        });

        if (existingDepartment) {
            throw new BadRequestException(
                this.i18nService.translate(
                    'departments.DEPARTMENT_NAME_ALREADY_EXISTS',
                ),
            );
        }

        if (!body.manager_id) {
            throw new BadRequestException(
                this.i18nService.translate('departments.MANAGER_ID_REQUIRED'),
            );
        }

        const manager = await this.userRepository.findById(body.manager_id);

        if (!manager) {
            throw new NotFoundException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        if (!manager.is_active || manager.role !== UserRole.MANAGER) {
            throw new BadRequestException(
                this.i18nService.translate(
                    'departments.INVALID_MANAGER_ROLE_OR_STATUS',
                ),
            );
        }

        const newDepartment = await this.departmentRepository.create(body);

        const usersCount = 0;

        const responseData = {
            ...newDepartment,
            manager: {
                manager_id: manager.user_id,
                manager_name: manager.full_name,
            },
            usersCount,
        };

        return plainToInstance(DepartmentResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
