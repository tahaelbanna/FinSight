import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectRepository } from './repositories/project.repository';
import { UpdateProjectStatusUseCase } from './usecases/update-project-status.usecase';
import { UpdateProjectUseCase } from './usecases/update-project.usecase';
import { GetProjectByIdUseCase } from './usecases/get-project-by-id.usecase';
import { GetAllProjectsUseCase } from './usecases/get-all-projects.usecase';
import { CreateProjectUseCase } from './usecases/create-project.usecase';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './schemas/project.schema';
import { DepartmentsModule } from 'src/departments/departments.module';
import { UsersModule } from 'src/users/users.module';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project]),
        DepartmentsModule,
        UsersModule,
        ActivityLogsModule,
    ],
    controllers: [ProjectsController],
    providers: [
        ProjectsService,
        ProjectRepository,
        CreateProjectUseCase,
        GetAllProjectsUseCase,
        GetProjectByIdUseCase,
        UpdateProjectUseCase,
        UpdateProjectStatusUseCase,
    ],
    exports: [ProjectsService, ProjectRepository],
})
export class ProjectsModule {}
