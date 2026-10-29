import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { ProjectRepository } from '../repositories/project.repository';
import { DepartmentRepository } from 'src/departments/repositories/department.repository';
import { CreateProjectDto } from '../dtos/create-project.dto';
import { ProjectResponseDto } from '../dtos/project-response.dto';
import { ActionType, EntityType, ProjectStatus } from '../../common/enums';
import { ActivityLogRepository } from 'src/activity-logs/repositories/activity-log.repository';

@Injectable()
export class CreateProjectUseCase {
    constructor(
        private readonly projectRepository: ProjectRepository,
        private readonly departmentRepository: DepartmentRepository,
        private readonly i18nService: I18nService,
        private readonly activityLogRepository: ActivityLogRepository,
    ) {}

    async execute(body: CreateProjectDto, admin_id: string): Promise<ProjectResponseDto> {
        const startDate = new Date(body.start_date);
        const endDate = new Date(body.end_date);

        if (endDate < startDate) {
            throw new BadRequestException(
                this.i18nService.translate('projects.END_DATE_BEFORE_START_DATE'),
            );
        }

        const department = await this.departmentRepository.findById(body.department_id);
        if (!department) {
            throw new NotFoundException(
                this.i18nService.translate('departments.DEPARTMENT_NOT_FOUND'),
            );
        }

        const newProject = await this.projectRepository.create({
            project_name: body.project_name,
            department_id: body.department_id,
            start_date: startDate,
            end_date: endDate,
            status: ProjectStatus.PLANNED,
        });

        const responseData = {
            project_id: newProject.project_id,
            project_name: newProject.project_name,
            department: {
                department_id: department.department_id,
                department_name: department.department_name,
            },
            start_date: newProject.start_date,
            end_date: newProject.end_date,
            status: newProject.status,
            created_at: newProject.created_at,
            updated_at: newProject.updated_at,
        };

        await this.activityLogRepository.create({
            user_id: admin_id,
            action_type: ActionType.PROJECT_CREATED,
            entity_type: EntityType.PROJECT,
            entity_id: newProject.project_id,
        });

        return plainToInstance(ProjectResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}