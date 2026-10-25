import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { ProjectRepository } from '../repositories/project.repository';
import { UpdateProjectStatusDto } from '../dtos/update-project-status.dto';
import { ProjectResponseDto } from '../dtos/project-response.dto';

@Injectable()
export class UpdateProjectStatusUseCase {
    constructor(
        private readonly projectRepository: ProjectRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        project_id: string,
        body: UpdateProjectStatusDto,
    ): Promise<ProjectResponseDto> {
        const project = await this.projectRepository.findById(project_id);

        if (!project) {
            throw new NotFoundException(
                this.i18nService.translate('projects.PROJECT_NOT_FOUND'),
            );
        }

        await this.projectRepository.updateById(project_id, {
            status: body.status,
        });

        const updatedProject = await this.projectRepository.findById(project_id, {
            relations: { department: true },
        });

        const responseData = {
            project_id: updatedProject.project_id,
            project_name: updatedProject.project_name,
            department: updatedProject.department
                ? {
                    department_id: updatedProject.department.department_id,
                    department_name: updatedProject.department.department_name,
                }
                : null,
            start_date: updatedProject.start_date,
            end_date: updatedProject.end_date,
            status: updatedProject.status,
            created_at: updatedProject.created_at,
            updated_at: updatedProject.updated_at,
        };

        return plainToInstance(ProjectResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}