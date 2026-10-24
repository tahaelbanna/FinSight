import { Injectable } from '@nestjs/common';
import { CreateUserUsecase } from './usecases/create-user.usecase';
import { GetAllUsersUseCase } from './usecases/get-all-users.usecase';
import { GetUserByIdUseCase } from './usecases/get-user-by-id.usecase';
import { UpdateUserStatusUseCase } from './usecases/update-user-status.usecase';
import { UpdateUserUsecase } from './usecases/update-user.usecase';
import { CreateUserDto } from './dtos/create-user.dto';
import { GetAllUsersDto } from './dtos/get-all-users.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { PaginatedResult } from 'src/common/data-access/base-repository';

@Injectable()
export class UsersService {
    constructor(
        private readonly createUserUsecase: CreateUserUsecase,
        private readonly getAllUsersUseCase: GetAllUsersUseCase,
        private readonly getUserByIdUseCase: GetUserByIdUseCase,
        private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
        private readonly updateUserUsecase: UpdateUserUsecase,
    ) {}

    async createUser(body: CreateUserDto): Promise<UserResponseDto> {
        return this.createUserUsecase.execute(body);
    }

    async getAllUsers(
        query: GetAllUsersDto,
    ): Promise<PaginatedResult<UserResponseDto>> {
        return this.getAllUsersUseCase.execute(query);
    }

    async getUserById(user_id: string): Promise<UserResponseDto> {
        return this.getUserByIdUseCase.execute(user_id);
    }

    async updateUserStatus(
        body: UpdateUserStatusDto,
        user_id: string,
        // currentUserId: string,
    ): Promise<UserResponseDto> {
        return this.updateUserStatusUseCase.execute(
            body,
            user_id, // currentUserId: string,
        );
    }

    async updateUser(
        body: UpdateUserDto,
        user_id: string,
    ): Promise<UserResponseDto> {
        return this.updateUserUsecase.execute(body, user_id);
    }
}
