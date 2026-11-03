import { Injectable } from '@nestjs/common';
import { UpdateProjectStatusUseCase } from './usecases/update-project-status.usecase';
import { UpdateProjectUseCase } from './usecases/update-project.usecase';
import { GetProjectByIdUseCase } from './usecases/get-project-by-id.usecase';
import { GetAllProjectsUseCase } from './usecases/get-all-projects.usecase';
import { CreateProjectUseCase } from './usecases/create-project.usecase';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { GetAllProjectsDto } from './dtos/get-all-projects.dto';
import { UpdateProjectStatusDto } from './dtos/update-project-status.dto';
import { ProjectResponseDto } from './dtos/project-response.dto';
import { PaginatedResult } from '../common/data-access';
import { UserRole } from 'src/common/enums';

@Injectable()
export class ProjectsService {
    constructor(
        private readonly createProjectUseCase: CreateProjectUseCase,
        private readonly getAllProjectsUseCase: GetAllProjectsUseCase,
        private readonly getProjectByIdUseCase: GetProjectByIdUseCase,
        private readonly updateProjectUseCase: UpdateProjectUseCase,
        private readonly updateProjectStatusUseCase: UpdateProjectStatusUseCase,
    ) {}

    async createProject(createProjectDto: CreateProjectDto, user_id: string): Promise<ProjectResponseDto> {
        return this.createProjectUseCase.execute(createProjectDto, user_id);
    }

    async getAllProjects(
        query: GetAllProjectsDto,
        user_id: string,
        role?: UserRole,
    ): Promise<PaginatedResult<ProjectResponseDto>> {
        return this.getAllProjectsUseCase.execute(query, user_id, role);
    }

    async getProjectById(
        projectId: string,
        user_id: string,
        role?: UserRole,
    ): Promise<ProjectResponseDto> {
        return this.getProjectByIdUseCase.execute(projectId, user_id, role);
    }

    async updateProject(
        projectId: string,
        updateProjectDto: UpdateProjectDto,
        user_id: string,
    ): Promise<ProjectResponseDto> {
        return this.updateProjectUseCase.execute(projectId, updateProjectDto, user_id);
    }

    async updateProjectStatus(
        projectId: string,
        updateProjectStatusDto: UpdateProjectStatusDto,
        user_id: string,
    ): Promise<ProjectResponseDto> {
        return this.updateProjectStatusUseCase.execute(projectId, updateProjectStatusDto, user_id);
    }
}
