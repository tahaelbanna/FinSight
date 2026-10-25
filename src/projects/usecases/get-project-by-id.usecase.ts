import { Injectable } from '@nestjs/common';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { plainToInstance } from 'class-transformer';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { ProjectResponseDto } from '../dtos/project-response.dto';
import { ProjectRepository } from '../repositories/project.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { I18nService } from 'nestjs-i18n';
import { UserRole } from 'src/common/enums';

@Injectable()
export class GetProjectByIdUseCase {
    constructor(
        private readonly projectRepository: ProjectRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(project_id: string, user_id: string): Promise<ProjectResponseDto> {
        const project = await this.projectRepository.findById(project_id, {
            relations: {
                department: true,
            },
        });

        if (!project) {
            throw new NotFoundException(
                this.i18nService.translate('projects.PROJECT_NOT_FOUND'),
            );
        }

        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser) {
            throw new UnauthorizedException(this.i18nService.translate('users.UNAUTHORIZED_USER'));
        }

        if (currentUser.role !== UserRole.ADMIN) {
            if (project.department_id !== currentUser.department_id) {
                throw new ForbiddenException(
                    this.i18nService.translate('projects.FORBIDDEN_DEPARTMENT_ACCESS'),
                );
            }
        }

        const responseData = {
            project_id: project.project_id,
            project_name: project.project_name,
            department: project.department
                ? {
                    department_id: project.department.department_id,
                    department_name: project.department.department_name,
                }
                : null,
            start_date: project.start_date,
            end_date: project.end_date,
            status: project.status,
            created_at: project.created_at,
            updated_at: project.updated_at,
        };

        return plainToInstance(ProjectResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}