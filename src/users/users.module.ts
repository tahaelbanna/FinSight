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

@Module({
    imports: [TypeOrmModule.forFeature([User, Department])],
    controllers: [UsersController],
    providers: [
        UsersService,
        UserRepository,
        CreateUserUsecase,
        GetAllUsersUseCase,
        GetUserByIdUseCase,
        UpdateUserStatusUseCase,
        UpdateUserUsecase,
    ],
    exports: [UsersService],
})
export class UsersModule {}