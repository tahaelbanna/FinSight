import { Injectable } from '@nestjs/common';
import { CreateBudgetUseCase } from './usecases/create-budget.usecase';
import { GetAllBudgetsUseCase } from './usecases/get-all-budgets.usecase';
import { GetBudgetByIdUseCase } from './usecases/get-budget-by-id.usecase';
import { UpdateBudgetUseCase } from './usecases/update-budget.usecase';

import { GetBudgetSummaryUseCase } from './usecases/get-budget-summary.usecase';
import { BudgetSummaryResponseDto } from './dtos/budget-summary-response.dto';

import { CreateBudgetDto } from './dtos/create-budget.dto';
import { UpdateBudgetDto } from './dtos/update-budget.dto';
import { GetAllBudgetsDto } from './dtos/get-all-budgets.dto';
import { BudgetResponseDto } from './dtos/budget-response.dto';
import { PaginatedResult } from 'src/common/data-access';
import { UserRole } from 'src/common/enums';

@Injectable()
export class BudgetsService {
    constructor(
        private readonly createBudgetUseCase: CreateBudgetUseCase,
        private readonly getAllBudgetsUseCase: GetAllBudgetsUseCase,
        private readonly getBudgetByIdUseCase: GetBudgetByIdUseCase,
        private readonly updateBudgetUseCase: UpdateBudgetUseCase,
        private readonly getBudgetSummaryUseCase: GetBudgetSummaryUseCase,
    ) {}

    async getSummary(
        user_id: string,
        role?: UserRole,
    ): Promise<BudgetSummaryResponseDto> {
        return this.getBudgetSummaryUseCase.execute(user_id, role);
    }

    async create(body: CreateBudgetDto, user_id: string): Promise<BudgetResponseDto> {
        return this.createBudgetUseCase.execute(body, user_id);
    }

    async getAll(
        query: GetAllBudgetsDto,
        user_id: string,
        role?: UserRole,
    ): Promise<PaginatedResult<BudgetResponseDto>> {
        return this.getAllBudgetsUseCase.execute(query, user_id, role);
    }

    async getOneById(
        budget_id: string,
        user_id: string,
        role?: UserRole,
    ): Promise<BudgetResponseDto> {
        return this.getBudgetByIdUseCase.execute(budget_id, user_id, role);
    }

    async update(budget_id: string, body: UpdateBudgetDto, user_id: string): Promise<BudgetResponseDto> {
        return this.updateBudgetUseCase.execute(budget_id, body, user_id);
    }
}