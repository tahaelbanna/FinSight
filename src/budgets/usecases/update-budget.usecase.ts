import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { BudgetRepository } from '../repositories/budget.repository';
import { UpdateBudgetDto } from '../dtos/update-budget.dto';
import { BudgetResponseDto } from '../dtos/budget-response.dto';
import { calculateBudgetMetrics } from '../utils/budget-calculator.util';
import { ExpenseMetricsQuery } from 'src/expenses/queries/expense-metrics.query';
import { ActionType, EntityType } from 'src/common/enums';
import { ActivityLogRepository } from 'src/activity-logs/repositories/activity-log.repository';

@Injectable()
export class UpdateBudgetUseCase {
    constructor(
        private readonly budgetRepository: BudgetRepository,
        private readonly i18nService: I18nService,
        private readonly expenseMetricsQuery: ExpenseMetricsQuery,
        private readonly activityLogRepository: ActivityLogRepository,
    ) {}

    async execute(
        budget_id: string,
        body: UpdateBudgetDto,
        user_id: string,
    ): Promise<BudgetResponseDto> {
        const budget = await this.budgetRepository.findById(budget_id);
        if (!budget) {
            throw new NotFoundException(
                this.i18nService.translate('budgets.BUDGET_NOT_FOUND'),
            );
        }

        const startDateToValidate = new Date(
            body.start_date ?? budget.start_date,
        );
        const endDateToValidate = new Date(body.end_date ?? budget.end_date);

        if (endDateToValidate <= startDateToValidate) {
            throw new BadRequestException(
                this.i18nService.translate(
                    'budgets.END_DATE_MUST_BE_AFTER_START_DATE',
                ),
            );
        }

        if (body.allocated_amount !== undefined) {
            const totalApprovedExpenses =
                await this.expenseMetricsQuery.getTotalApprovedByScope(
                    budget.start_date,
                    budget.end_date,
                    budget.department_id,
                    budget.project_id,
                );
            if (body.allocated_amount < totalApprovedExpenses) {
                throw new BadRequestException(
                    this.i18nService.translate(
                        'budgets.CANNOT_REDUCE_BELOW_EXPENSES',
                    ),
                );
            }
        }

        await this.budgetRepository.updateById(budget_id, {
            allocated_amount: body.allocated_amount ?? budget.allocated_amount,
            start_date: body.start_date
                ? new Date(body.start_date)
                : budget.start_date,
            end_date: body.end_date ? new Date(body.end_date) : budget.end_date,
        });

        const updatedBudget = await this.budgetRepository.findById(budget_id, {
            relations: { department: true, project: true, creator: true },
        });

        const finalTotalApproved =
            await this.expenseMetricsQuery.getTotalApprovedByScope(
                updatedBudget.start_date,
                updatedBudget.end_date,
                updatedBudget.department_id,
                updatedBudget.project_id,
            );
        const metrics = calculateBudgetMetrics(
            Number(updatedBudget.allocated_amount),
            finalTotalApproved,
        );

        const responseData = {
            budget_id: updatedBudget.budget_id,
            department: updatedBudget.department
                ? {
                    id: updatedBudget.department.department_id,
                    name: updatedBudget.department.department_name,
                }
                : null,
            project: updatedBudget.project
                ? {
                    id: updatedBudget.project.project_id,
                    name: updatedBudget.project.project_name,
                }
                : null,
            allocated_amount: Number(updatedBudget.allocated_amount),
            start_date: updatedBudget.start_date,
            end_date: updatedBudget.end_date,
            created_by: updatedBudget.creator
                ? {
                    user_id: updatedBudget.creator.user_id,
                    full_name: updatedBudget.creator.full_name,
                }
                : null,
            ...metrics,
        };

        await this.activityLogRepository.create({
            user_id: user_id,
            action_type: ActionType.BUDGET_UPDATED,
            entity_type: EntityType.BUDGET,
            entity_id: budget_id,
        });

        return plainToInstance(BudgetResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
