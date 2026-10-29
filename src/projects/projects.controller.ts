import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Patch,
} from '@nestjs/common';
import { AllowRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { UpdateProjectStatusDto } from './dtos/update-project-status.dto';
import { GetAllProjectsDto } from './dtos/get-all-projects.dto';
import { ProjectResponseDto } from './dtos/project-response.dto';
import { PaginatedResult } from 'src/common/data-access';
import {
    CurrentUser,
    Principal,
} from 'src/auth/decorators/current-user.decorator';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    @Post()
    @AllowRoles(UserRole.ADMIN)
    async create(
        @Body() body: CreateProjectDto,
        @CurrentUser() principal: Principal,
    ): Promise<ProjectResponseDto> {
        return this.projectsService.createProject(body, principal.user.user_id);
    }

    @Get()
    async getAll(
        @Query() query: GetAllProjectsDto,
        @CurrentUser() principal: Principal,
    ): Promise<PaginatedResult<ProjectResponseDto>> {
        const userId = principal.user.user_id;
        return this.projectsService.getAllProjects(query, userId);
    }

    @Get(':project_id')
    async getOneById(
        @Param('project_id') project_id: string,
        @CurrentUser() principal: Principal,
    ): Promise<ProjectResponseDto> {
        const userId = principal.user.user_id;
        return this.projectsService.getProjectById(project_id, userId);
    }

    @Patch(':project_id')
    @AllowRoles(UserRole.ADMIN)
    async update(
        @Param('project_id') project_id: string,
        @Body() body: UpdateProjectDto,
        @CurrentUser() principal: Principal,
    ): Promise<ProjectResponseDto> {
        return this.projectsService.updateProject(project_id, body, principal.user.user_id);
    }

    @Patch(':project_id/status')
    @AllowRoles(UserRole.ADMIN)
    async updateStatus(
        @Param('project_id') project_id: string,
        @Body() body: UpdateProjectStatusDto,
        @CurrentUser() principal: Principal,
    ): Promise<ProjectResponseDto> {
        return this.projectsService.updateProjectStatus(project_id, body, principal.user.user_id);
    }
}
