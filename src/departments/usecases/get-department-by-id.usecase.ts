import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { DepartmentResponseDto } from '../dtos/department-response.dto';
import { DepartmentRepository } from '../repositories/department.repository';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class GetDepartmentByIdUseCase {
    constructor(
        private readonly departmentRepository: DepartmentRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(department_id: string): Promise<DepartmentResponseDto> {
        const department = await this.departmentRepository.findOne({
            where: { department_id },
            relations: {
                users: true,
                manager: true,
            },
        });

        if (!department) {
            throw new NotFoundException(
                this.i18nService.translate('departments.DEPARTMENT_NOT_FOUND'),
            );
        }

        const responseData = {
            department_id: department.department_id,
            department_name: department.department_name,
            description: department.description,
            manager: department.manager
                ? {
                    manager_id: department.manager.user_id,
                    manager_name: department.manager.full_name,
                }
                : null,
            usersCount: department.users ? department.users.length : 0,
            users: department.users
                ? department.users.map((user) => ({
                    user_id: user.user_id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                }))
                : [],
            created_at: department.created_at,
            updated_at: department.updated_at,
        };

        return plainToInstance(DepartmentResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}