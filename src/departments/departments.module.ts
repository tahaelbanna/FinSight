import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentRepository } from './repositories/department.repository';
import { DeleteDepartmentUseCase } from './usecases/delete-department.usecase';
import { UpdateDepartmentUseCase } from './usecases/update-department.usecase';
import { GetDepartmentByIdUseCase } from './usecases/get-department-by-id.usecase';
import { CreateDepartmentUseCase } from './usecases/create-department.usecase';
import { GetAllDepartmentsUseCase } from './usecases/get-all-departments.usecase';
import { Department } from './schemas/departments.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/schemas/users.schema';
import { UserRepository } from 'src/users/repositories/users.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Department, User])],
    providers: [
        DepartmentsService,
        DepartmentRepository,
        CreateDepartmentUseCase,
        GetDepartmentByIdUseCase,
        UpdateDepartmentUseCase,
        DeleteDepartmentUseCase,
        GetAllDepartmentsUseCase,
        UserRepository,
    ],
    controllers: [DepartmentsController],
    exports: [DepartmentsService, DepartmentRepository],
})
export class DepartmentsModule {}
