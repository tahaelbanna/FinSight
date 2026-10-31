import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { plainToInstance } from 'class-transformer';
import {
    FindOptionsWhere,
    LessThanOrEqual,
    MoreThanOrEqual,
    IsNull,
    Not,
} from 'typeorm';
import { PaginatedResult } from 'src/common/data-access';
import { BudgetRepository } from '../repositories/budget.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { GetAllBudgetsDto } from '../dtos/get-all-budgets.dto';
import { BudgetResponseDto } from '../dtos/budget-response.dto';
import { Budget } from '../schemas/budget.schema';
import { UserRole, BudgetScopeFilter } from 'src/common/enums';
import { I18nService } from 'nestjs-i18n';
import { calculateBudgetMetrics } from '../utils/budget-calculator.util';
import { ExpenseMetricsQuery } from 'src/expenses/queries/expense-metrics.query';

@Injectable()
export class GetAllBudgetsUseCase {
    constructor(
        private readonly budgetRepository: BudgetRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
        private readonly expenseMetricsQuery: ExpenseMetricsQuery,
    ) {}

    async execute(
        query: GetAllBudgetsDto,
        user_id: string,
    ): Promise<PaginatedResult<BudgetResponseDto>> {
        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser) {
            throw new UnauthorizedException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        const commonFilters: FindOptionsWhere<Budget> = {};
        if (query.date_from) {
            commonFilters.start_date = MoreThanOrEqual(
                new Date(query.date_from),
            );
        }
        if (query.date_to) {
            commonFilters.end_date = LessThanOrEqual(new Date(query.date_to));
        }
        if (query.scope === BudgetScopeFilter.DEPARTMENT) {
            commonFilters.department_id = Not(IsNull());
        } else if (query.scope === BudgetScopeFilter.PROJECT) {
            commonFilters.project_id = Not(IsNull());
        }

        let whereCondition:
            FindOptionsWhere<Budget> | FindOptionsWhere<Budget>[] = [];
        if (
            currentUser.role === UserRole.ADMIN ||
            currentUser.role === UserRole.FINANCE_OFFICER
        ) {
            if (query.department_id)
                commonFilters.department_id = query.department_id;
            if (query.project_id) commonFilters.project_id = query.project_id;
            whereCondition = commonFilters;
        } else {
            if (!currentUser.department_id) {
                return new PaginatedResult<BudgetResponseDto>(
                    [],
                    0,
                    query.page || 1,
                    query.limit || 10,
                );
            }
            whereCondition = [
                { ...commonFilters, department_id: currentUser.department_id },
                {
                    ...commonFilters,
                    project: { department_id: currentUser.department_id },
                },
            ];
        }

        const hasOverrunFilter = query.is_overrun !== undefined;

        const result = await this.budgetRepository.findPaginated({
            where: whereCondition,
            relations: { department: true, project: true, creator: true },
            page: hasOverrunFilter ? 1 : query.page || 1,
            limit: hasOverrunFilter ? 999999 : query.limit || 10,
            order: { created_at: 'DESC' },
            ignoreLimit: hasOverrunFilter,
        });

        const formattedData = await Promise.all(
            result.data.map(async (budget) => {
                const totalApproved =
                    await this.expenseMetricsQuery.getTotalApprovedByScope(
                        budget.start_date,
                        budget.end_date,
                        budget.department_id,
                        budget.project_id,
                    );
                const metrics = calculateBudgetMetrics(
                    Number(budget.allocated_amount),
                    totalApproved,
                );
                return {
                    budget_id: budget.budget_id,
                    department: budget.department
                        ? {
                              id: budget.department.department_id,
                              name: budget.department.department_name,
                          }
                        : null,
                    project: budget.project
                        ? {
                              id: budget.project.project_id,
                              name: budget.project.project_name,
                          }
                        : null,
                    allocated_amount: Number(budget.allocated_amount),
                    start_date: budget.start_date,
                    end_date: budget.end_date,
                    created_by: budget.creator
                        ? {
                              user_id: budget.creator.user_id,
                              full_name: budget.creator.full_name,
                          }
                        : null,
                    ...metrics,
                };
            }),
        );

        let finalData = formattedData;
        if (hasOverrunFilter) {
            finalData = formattedData.filter(
                (b) => b.is_overrun === query.is_overrun,
            );
        }

        const page = query.page || 1;
        const limit = query.limit || 10;
        const total = finalData.length;

        const paginatedData = hasOverrunFilter
            ? finalData.slice((page - 1) * limit, page * limit)
            : finalData;

        return {
            data: plainToInstance(BudgetResponseDto, paginatedData, {
                excludeExtraneousValues: true,
            }),
            meta: {
                page,
                limit,
                total,
                totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
            },
        };
    }
}
