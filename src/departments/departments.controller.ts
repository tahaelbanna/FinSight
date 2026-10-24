import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Patch,
    Delete,
} from '@nestjs/common';
import { AllowRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';
import { GetAllDepartmentsDto } from './dtos/get-all-departments.dto';
import { DepartmentResponseDto } from './dtos/department-response.dto';
import { PaginatedResult } from 'src/common/data-access';
import { DepartmentsService } from './departments.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) {}

    @Post()
    @AllowRoles(UserRole.ADMIN)
    async create(
        @Body() body: CreateDepartmentDto,
    ): Promise<DepartmentResponseDto> {
        return this.departmentsService.create(body);
    }

    @Get()
    async getAll(
        @Query() query: GetAllDepartmentsDto,
    ): Promise<PaginatedResult<DepartmentResponseDto>> {
        return this.departmentsService.GetAll(query);
    }

    @Get(':department_id')
    async getOneById(
        @Param('department_id') department_id: string,
    ): Promise<DepartmentResponseDto> {
        return this.departmentsService.GetOneById(department_id);
    }

    @Patch(':department_id')
    @AllowRoles(UserRole.ADMIN)
    async update(
        @Param('department_id') department_id: string,
        @Body() body: UpdateDepartmentDto,
    ): Promise<DepartmentResponseDto> {
        return this.departmentsService.update(department_id, body);
    }

    @Delete(':department_id')
    @AllowRoles(UserRole.ADMIN)
    async remove(@Param('department_id') department_id: string): Promise<void> {
        return this.departmentsService.remove(department_id);
    }
}
