import { Injectable } from '@nestjs/common';
import { DeleteDepartmentUseCase } from './usecases/delete-department.usecase';
import { UpdateDepartmentUseCase } from './usecases/update-department.usecase';
import { GetDepartmentByIdUseCase } from './usecases/get-department-by-id.usecase';
import { CreateDepartmentUseCase } from './usecases/create-department.usecase';
import { GetAllDepartmentsUseCase } from './usecases/get-all-departments.usecase';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';
import { GetAllDepartmentsDto } from './dtos/get-all-departments.dto';
import { DepartmentResponseDto } from './dtos/department-response.dto';
import { PaginatedResult } from 'src/common/data-access';

@Injectable()
export class DepartmentsService {
    constructor(
        private readonly createDepartmentUseCase: CreateDepartmentUseCase,
        private readonly getAllDepartmentsUseCase: GetAllDepartmentsUseCase,
        private readonly getDepartmentByIdUseCase: GetDepartmentByIdUseCase,
        private readonly updateDepartmentUseCase: UpdateDepartmentUseCase,
        private readonly deleteDepartmentUseCase: DeleteDepartmentUseCase,
    ) {}

    async create(body: CreateDepartmentDto): Promise<DepartmentResponseDto> {
        return this.createDepartmentUseCase.execute(body);
    }

    async GetAll(query: GetAllDepartmentsDto): Promise<PaginatedResult<DepartmentResponseDto>> {
        return this.getAllDepartmentsUseCase.execute(query);
    }

    async GetOneById(department_id: string): Promise<DepartmentResponseDto> {
        return this.getDepartmentByIdUseCase.execute(department_id);
    }

    async update(department_id: string, body: UpdateDepartmentDto): Promise<DepartmentResponseDto> {
        return this.updateDepartmentUseCase.execute(department_id, body);
    }

    async remove(department_id: string): Promise<void> {
        return this.deleteDepartmentUseCase.execute(department_id);
    }
}
