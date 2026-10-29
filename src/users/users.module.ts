import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/users.repository';
import { CreateUserUsecase } from './usecases/create-user.usecase';
import { GetAllUsersUseCase } from './usecases/get-all-users.usecase';
import { GetUserByIdUseCase } from './usecases/get-user-by-id.usecase';
import { UpdateUserStatusUseCase } from './usecases/update-user-status.usecase';
import { UpdateUserUsecase } from './usecases/update-user.usecase';
import { User } from './schemas/users.schema';
import { Department } from 'src/departments/schemas/departments.schema';
import { GetOneUserUseCase } from './usecases/get-one.usercase';
import { AuthModule } from 'src/auth/auth.module';
import { forwardRef } from '@nestjs/common';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Department]),
        forwardRef(() => AuthModule),
        forwardRef(() => ActivityLogsModule),
    ],
    controllers: [UsersController],
    providers: [
        UsersService,
        UserRepository,
        CreateUserUsecase,
        GetAllUsersUseCase,
        GetUserByIdUseCase,
        UpdateUserStatusUseCase,
        UpdateUserUsecase,
        GetOneUserUseCase,
    ],
    exports: [UsersService, UserRepository],
})
export class UsersModule {}
