import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserResponseDto } from './dtos/user-response.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { PaginatedResult } from 'src/common/data-access/base-repository';
import { GetAllUsersDto } from './dtos/get-all-users.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AllowRoles } from 'src/auth/decorators/roles.decorator';
import {
    CurrentUser,
    Principal,
} from '../auth/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums';
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @AllowRoles(UserRole.ADMIN)
    @Post()
    async createUser(@Body() body: CreateUserDto): Promise<UserResponseDto> {
        return this.usersService.createUser(body);
    }

    @AllowRoles(UserRole.ADMIN)
    @Get()
    async getAllUsers(
        @Query() query: GetAllUsersDto,
    ): Promise<PaginatedResult<UserResponseDto>> {
        return this.usersService.getAllUsers(query);
    }

    @AllowRoles(UserRole.ADMIN)
    @Get(':user_id')
    async getUserById(
        @Param('user_id') user_id: string,
    ): Promise<UserResponseDto> {
        return this.usersService.getUserById(user_id);
    }

    @AllowRoles(UserRole.ADMIN)
    @Patch(':user_id')
    async updateUser(
        @Body() body: UpdateUserDto,
        @Param('user_id') user_id: string,
    ): Promise<UserResponseDto> {
        return this.usersService.updateUser(body, user_id);
    }

    @AllowRoles(UserRole.ADMIN)
    @Patch(':user_id/status')
    async updateUserStatus(
        @Body() body: UpdateUserStatusDto,
        @Param('user_id') user_id: string,
        @CurrentUser() principal: Principal,
    ): Promise<UserResponseDto> {
        return this.usersService.updateUserStatus(
            body,
            user_id,
            principal.user.user_id,
        );
    }
}
