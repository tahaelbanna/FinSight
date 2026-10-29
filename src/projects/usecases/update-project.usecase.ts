import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { ProjectRepository } from '../repositories/project.repository';
import { UpdateProjectDto } from '../dtos/update-project.dto';
import { ProjectResponseDto } from '../dtos/project-response.dto';
import { ActionType, EntityType } from 'src/common/enums';
import { ActivityLogRepository } from 'src/activity-logs/repositories/activity-log.repository';

@Injectable()
export class UpdateProjectUseCase {
    constructor(
        private readonly projectRepository: ProjectRepository,
        private readonly i18nService: I18nService,
        private readonly activityLogRepository: ActivityLogRepository,
    ) {}

    async execute(
        project_id: string,
        body: UpdateProjectDto,
        admin_id: string,
    ): Promise<ProjectResponseDto> {
        const project = await this.projectRepository.findById(project_id, {
            relations: { department: true },
        });

        if (!project) {
            throw new NotFoundException(
                this.i18nService.translate('projects.PROJECT_NOT_FOUND'),
            );
        }

        const startDateToValidate = new Date(
            body.start_date ?? project.start_date,
        );
        const endDateToValidate = new Date(body.end_date ?? project.end_date);

        if (endDateToValidate < startDateToValidate) {
            throw new BadRequestException(
                this.i18nService.translate(
                    'projects.END_DATE_BEFORE_START_DATE',
                ),
            );
        }

        await this.projectRepository.updateById(project_id, {
            project_name: body.project_name ?? project.project_name,
            start_date: body.start_date
                ? new Date(body.start_date)
                : project.start_date,
            end_date: body.end_date
                ? new Date(body.end_date)
                : project.end_date,
        });

        const updatedProject = await this.projectRepository.findById(
            project_id,
            {
                relations: { department: true },
            },
        );

        const responseData = {
            project_id: updatedProject.project_id,
            project_name: updatedProject.project_name,
            department: updatedProject.department
                ? {
                      department_id: updatedProject.department.department_id,
                      department_name:
                          updatedProject.department.department_name,
                  }
                : null,
            start_date: updatedProject.start_date,
            end_date: updatedProject.end_date,
            status: updatedProject.status,
            created_at: updatedProject.created_at,
            updated_at: updatedProject.updated_at,
        };

        await this.activityLogRepository.create({
            user_id: admin_id,
            action_type: ActionType.PROJECT_UPDATED,
            entity_type: EntityType.PROJECT,
            entity_id: updatedProject.project_id,
        });

        return plainToInstance(ProjectResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
