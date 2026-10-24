// departments/usecases/update-department.usecase.ts
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { DepartmentRepository } from '../repositories/department.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { UpdateDepartmentDto } from '../dtos/update-department.dto';
import { DepartmentResponseDto } from '../dtos/department-response.dto';
import { UserRole } from 'src/common/enums';
import { Not } from 'typeorm';

@Injectable()
export class UpdateDepartmentUseCase {
    constructor(
        private readonly departmentRepository: DepartmentRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        department_id: string,
        body: UpdateDepartmentDto,
    ): Promise<DepartmentResponseDto> {
        const department = await this.departmentRepository.findById(
            department_id,
            {
                relations: { users: true, manager: true },
            },
        );

        if (!department) {
            throw new NotFoundException(
                this.i18nService.translate('departments.DEPARTMENT_NOT_FOUND'),
            );
        }

        if (
            body.department_name &&
            body.department_name !== department.department_name
        ) {
            const existingDepartment = await this.departmentRepository.findOne({
                where: {
                    department_name: body.department_name,
                    department_id: Not(department_id),
                },
            });

            if (existingDepartment) {
                throw new BadRequestException(
                    this.i18nService.translate(
                        'departments.DEPARTMENT_NAME_ALREADY_EXISTS',
                    ),
                );
            }
        }

        let newManagerId = department.manager_id;

        if (body.manager_id !== undefined) {
            if (!body.manager_id) {
                throw new BadRequestException(
                    this.i18nService.translate(
                        'departments.MANAGER_ID_REQUIRED',
                    ),
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

            newManagerId = body.manager_id;
        }

        await this.departmentRepository.updateById(department_id, {
            department_name: body.department_name ?? department.department_name,
            description: body.description ?? department.description,
            manager_id: newManagerId,
        });

        const finalDepartment = await this.departmentRepository.findOne({
            where: { department_id },
            relations: { users: true, manager: true },
        });

        const responseData = {
            department_id: finalDepartment.department_id,
            department_name: finalDepartment.department_name,
            description: finalDepartment.description,
            manager: finalDepartment.manager
                ? {
                    manager_id: finalDepartment.manager.user_id,
                    manager_name: finalDepartment.manager.full_name,
                }
                : null,
            usersCount: finalDepartment.users
                ? finalDepartment.users.length
                : 0,
            users: finalDepartment.users
                ? finalDepartment.users.map((user) => ({
                    user_id: user.user_id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                }))
                : [],
            created_at: finalDepartment.created_at,
            updated_at: finalDepartment.updated_at,
        };

        return plainToInstance(DepartmentResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
