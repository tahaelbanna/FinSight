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
import { GetOneUserUseCase } from './usecases/get-one.usercase';
import { User } from './schemas/users.schema';
import { FindOptionsWhere } from 'typeorm';
import { UserAuthResponseDto } from './dtos/user-auth-response';
@Injectable()
export class UsersService {
    constructor(
        private readonly createUserUsecase: CreateUserUsecase,
        private readonly getAllUsersUseCase: GetAllUsersUseCase,
        private readonly getUserByIdUseCase: GetUserByIdUseCase,
        private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
        private readonly updateUserUsecase: UpdateUserUsecase,
        private readonly getOneUserUseCase: GetOneUserUseCase,
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
        currentUserId: string,
    ): Promise<UserResponseDto> {
        return this.updateUserStatusUseCase.execute(
            body,
            user_id,
            currentUserId,
        );
    }

    async updateUser(
        body: UpdateUserDto,
        user_id: string,
    ): Promise<UserResponseDto> {
        return this.updateUserUsecase.execute(body, user_id);
    }

    async getOne(query: FindOptionsWhere<User>): Promise<UserAuthResponseDto> {
        return this.getOneUserUseCase.execute(query);
    }
}
