import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { plainToInstance } from 'class-transformer';
import { FindOptionsWhere, ILike } from 'typeorm';
import { PaginatedResult } from 'src/common/data-access';
import { ProjectRepository } from '../repositories/project.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { GetAllProjectsDto } from '../dtos/get-all-projects.dto';
import { ProjectResponseDto } from '../dtos/project-response.dto';
import { Project } from '../schemas/project.schema';
import { UserRole } from 'src/common/enums';
import { I18nService } from 'nestjs-i18n';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';

@Injectable()
export class GetAllProjectsUseCase {
    constructor(
        private readonly projectRepository: ProjectRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        query: GetAllProjectsDto,
        user_id: string,
    ): Promise<PaginatedResult<ProjectResponseDto>> {
        const currentUser = await this.userRepository.findById(user_id);

        if (!currentUser) {
            throw new UnauthorizedException(this.i18nService.translate('users.UNAUTHORIZED_USER'));
        }

        const baseWhere: FindOptionsWhere<Project> = {};

        if (currentUser.role === UserRole.ADMIN) {
            if (query.department_id) {
                baseWhere.department_id = query.department_id;
            }
        } else {
            if (!currentUser.department_id) {
                return new PaginatedResult<ProjectResponseDto>([], 0, query.page || 1, query.limit || 10);
            }
            
            if (query.department_id && query.department_id !== currentUser.department_id) {
                throw new ForbiddenException(
                    this.i18nService.translate('projects.FORBIDDEN_DEPARTMENT_ACCESS')
                );
            }
            baseWhere.department_id = currentUser.department_id;
        }

        if (query.status) {
            baseWhere.status = query.status;
        }

        let whereCondition: FindOptionsWhere<Project> | FindOptionsWhere<Project>[] = baseWhere;
        if (query.search) {
            const searchTerm = `%${query.search.trim()}%`;
            whereCondition = [
                { ...baseWhere, project_name: ILike(searchTerm) },
            ];
        }

        const result = await this.projectRepository.findPaginated({
            where: whereCondition,
            relations: {
                department: true,
            },
            page: query.page || 1,
            limit: query.limit || 10,
            order: {
                created_at: 'DESC',
            },
        });

        const formattedData = result.data.map((project) => ({
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
        }));

        return {
            ...result,
            data: plainToInstance(ProjectResponseDto, formattedData, {
                excludeExtraneousValues: true,
            }),
        };
    }
}