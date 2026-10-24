import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FindOptionsWhere, ILike } from 'typeorm';
import { PaginatedResult } from 'src/common/data-access';
import { GetAllDepartmentsDto } from '../dtos/get-all-departments.dto';
import { DepartmentResponseDto } from '../dtos/department-response.dto';
import { DepartmentRepository } from '../repositories/department.repository';
import { Department } from '../schemas/departments.schema';

@Injectable()
export class GetAllDepartmentsUseCase {
    constructor(private readonly departmentRepository: DepartmentRepository) {}

    async execute(
        query: GetAllDepartmentsDto,
    ): Promise<PaginatedResult<DepartmentResponseDto>> {
        const baseWhere: FindOptionsWhere<Department> = {};

        if (query?.manager_id) {
            baseWhere.manager_id = query.manager_id;
        }

        let whereCondition:
            FindOptionsWhere<Department> | FindOptionsWhere<Department>[] =
            baseWhere;

        if (query?.search) {
            const searchTerm = `%${query.search.trim()}%`;
            whereCondition = [
                { ...baseWhere, department_name: ILike(searchTerm) },
                { ...baseWhere, description: ILike(searchTerm) },
            ];
        }

        const result = await this.departmentRepository.findPaginated({
            where: whereCondition,
            relations: {
                users: true,
                manager: true,
            },
            page: query?.page || 1,
            limit: query?.limit || 10,
            order: {
                created_at: 'DESC',
            },
        });

        const formattedData = result.data.map((dept) => {
            return {
                department_id: dept.department_id,
                department_name: dept.department_name,
                description: dept.description,
                manager: dept.manager
                    ? {
                        manager_id: dept.manager.user_id,
                        manager_name: dept.manager.full_name,
                    }
                    : null,
                usersCount: dept.users ? dept.users.length : 0,
                created_at: dept.created_at,
                updated_at: dept.updated_at,
            };
        });

        return {
            ...result,
            data: plainToInstance(DepartmentResponseDto, formattedData, {
                excludeExtraneousValues: true,
            }),
        };
    }
}
