import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Patch,
} from '@nestjs/common';
import { AllowRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { CurrentUser, Principal } from 'src/auth/decorators/current-user.decorator';
import { PaginatedResult } from 'src/common/data-access';

import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dtos/create-budget.dto';
import { UpdateBudgetDto } from './dtos/update-budget.dto';
import { GetAllBudgetsDto } from './dtos/get-all-budgets.dto';
import { BudgetResponseDto } from './dtos/budget-response.dto';
import { BudgetSummaryResponseDto } from './dtos/budget-summary-response.dto';

@Controller('budgets')
export class BudgetsController {
    constructor(private readonly budgetsService: BudgetsService) {}

    @Get('summary')
    async getSummary(
        @CurrentUser() principal: Principal,
    ): Promise<BudgetSummaryResponseDto> {
        return this.budgetsService.getSummary(
            principal.user.user_id,
            principal.role,
        );
    }

    @Post()
    @AllowRoles(UserRole.FINANCE_OFFICER)
    async create(
        @Body() body: CreateBudgetDto,
        @CurrentUser() principal: Principal,
    ): Promise<BudgetResponseDto> {
        return this.budgetsService.create(body, principal.user.user_id);
    }

    @Get()
    async getAll(
        @Query() query: GetAllBudgetsDto,
        @CurrentUser() principal: Principal,
    ): Promise<PaginatedResult<BudgetResponseDto>> {
        return this.budgetsService.getAll(
            query,
            principal.user.user_id,
            principal.role,
        );
    }

    @Get(':budget_id')
    async getOneById(
        @Param('budget_id') budget_id: string,
        @CurrentUser() principal: Principal,
    ): Promise<BudgetResponseDto> {
        return this.budgetsService.getOneById(
            budget_id,
            principal.user.user_id,
            principal.role,
        );
    }

    @Patch(':budget_id')
    @AllowRoles(UserRole.FINANCE_OFFICER)
    async update(
        @Param('budget_id') budget_id: string,
        @Body() body: UpdateBudgetDto,
        @CurrentUser() principal: Principal,
    ): Promise<BudgetResponseDto> {
        return this.budgetsService.update(budget_id, body, principal.user.user_id);
    }
}