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

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async createUser(@Body() body: CreateUserDto): Promise<UserResponseDto> {
        return this.usersService.createUser(body);
    }

    @Get()
    async getAllUsers(
        @Query() query: GetAllUsersDto,
    ): Promise<PaginatedResult<UserResponseDto>> {
        return this.usersService.getAllUsers(query);
    }

    @Get(':user_id')
    async getUserById(
        @Param('user_id') user_id: string,
    ): Promise<UserResponseDto> {
        return this.usersService.getUserById(user_id);
    }

    @Patch(':user_id')
    async updateUser(
        @Body() body: UpdateUserDto,
        @Param('user_id') user_id: string,
    ): Promise<UserResponseDto> {
        return this.usersService.updateUser(body, user_id);
    }

    @Patch(':user_id/status')
    async updateUserStatus(
        @Body() body: UpdateUserStatusDto,
        @Param('user_id') user_id: string,
        // currentUserId: string,
    ): Promise<UserResponseDto> {
        return this.usersService.updateUserStatus(
            body,
            user_id,
            // currentUserId,
        );
    }
}
