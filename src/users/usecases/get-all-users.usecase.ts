import { Injectable } from '@nestjs/common';
import { UserResponseDto } from '../dtos/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { FindOptionsWhere, ILike } from 'typeorm';
import { UserRepository } from '../repositories/users.repository';
import { PaginatedResult } from 'src/common/data-access';
import { User } from '../schemas/users.schema';
import { GetAllUsersDto } from '../dtos/get-all-users.dto';

@Injectable()
export class GetAllUsersUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(
        query: GetAllUsersDto,
    ): Promise<PaginatedResult<UserResponseDto>> {
        const baseWhere: FindOptionsWhere<User> = {};

        if (query?.role) {
            baseWhere.role = query.role;
        }

        if (query?.department_id) {
            baseWhere.department_id = query.department_id;
        }

        if (typeof query?.is_active === 'boolean') {
            baseWhere.is_active = query.is_active;
        }

        let whereCondition: FindOptionsWhere<User> | FindOptionsWhere<User>[] =
            baseWhere;

        if (query?.search) {
            const searchTerm = `%${query.search.trim()}%`;
            whereCondition = [
                { ...baseWhere, full_name: ILike(searchTerm) },
                { ...baseWhere, email: ILike(searchTerm) },
            ];
        }

        const result = await this.userRepository.findPaginated({
            where: whereCondition,
            relations: {
                department: true, 
            },
            page: query?.page || 1,
            limit: query?.limit || 10,
            order: {
                created_at: 'DESC',
            },
        });

        return {
            ...result,
            data: plainToInstance(UserResponseDto, result.data),
        };
    }
}
