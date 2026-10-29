// departments/usecases/delete-department.usecase.ts
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { ConflictException } from 'src/common/error-handling/custom-exceptions/conflict.exception';
import { DepartmentRepository } from '../repositories/department.repository';
import { ActivityLogRepository } from 'src/activity-logs/repositories/activity-log.repository';
import { EntityType, ActionType } from 'src/common/enums';

@Injectable()
export class DeleteDepartmentUseCase {
    constructor(
        private readonly departmentRepository: DepartmentRepository,
        private readonly i18nService: I18nService,
        private readonly activityLogRepository: ActivityLogRepository,
    ) {}

    async execute(department_id: string, admin_id: string): Promise<void> {
        const department = await this.departmentRepository.findById(
            department_id,
            {
                relations: { users: true, projects: true },
            },
        );

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

        await this.activityLogRepository.create({
            user_id: admin_id,
            action_type: ActionType.DEPARTMENT_DELETED,
            entity_type: EntityType.DEPARTMENT,
            entity_id: department_id,
        });
    }
}
