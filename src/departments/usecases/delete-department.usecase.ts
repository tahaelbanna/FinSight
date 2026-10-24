// departments/usecases/delete-department.usecase.ts
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { ConflictException } from 'src/common/error-handling/custom-exceptions/conflict.exception';
import { DepartmentRepository } from '../repositories/department.repository';

@Injectable()
export class DeleteDepartmentUseCase {
    constructor(
        private readonly departmentRepository: DepartmentRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(department_id: string): Promise<void> {
        const department = await this.departmentRepository.findById(department_id, {
            relations: { users: true },
        });

        if (!department) {
            throw new NotFoundException(
                this.i18nService.translate('departments.DEPARTMENT_NOT_FOUND'),
            );
        }

        if (department.users && department.users.length > 0) {
            throw new ConflictException(
                this.i18nService.translate(
                    'departments.CANNOT_DELETE_DEPARTMENT_WITH_USERS',
                ),
            );
        }

        await this.departmentRepository.deleteById(department_id);
    }
}