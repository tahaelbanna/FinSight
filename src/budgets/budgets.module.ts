import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetRepository } from './repositories/budget.repository';
import { Budget } from './schemas/budget.schema';

import { CreateBudgetUseCase } from './usecases/create-budget.usecase';
import { GetAllBudgetsUseCase } from './usecases/get-all-budgets.usecase';
import { GetBudgetByIdUseCase } from './usecases/get-budget-by-id.usecase';
import { UpdateBudgetUseCase } from './usecases/update-budget.usecase';

import { DepartmentsModule } from 'src/departments/departments.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Budget]),
        DepartmentsModule,
        ProjectsModule,
        UsersModule,
    ],
    providers: [
        BudgetsService,
        BudgetRepository,
        CreateBudgetUseCase,
        GetAllBudgetsUseCase,
        GetBudgetByIdUseCase,
        UpdateBudgetUseCase,
    ],
    controllers: [BudgetsController],
    exports: [BudgetsService, BudgetRepository],
})
export class BudgetsModule {}
