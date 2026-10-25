import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { BudgetRepository } from '../repositories/budget.repository';
import { UpdateBudgetDto } from '../dtos/update-budget.dto';
import { BudgetResponseDto } from '../dtos/budget-response.dto';

@Injectable()
export class UpdateBudgetUseCase {
    constructor(
        private readonly budgetRepository: BudgetRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        budget_id: string,
        body: UpdateBudgetDto,
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

        // TODO: 
        // if (body.allocated_amount !== undefined) {
        //     const totalApprovedExpenses =
        //         await this.expenseRepository.getTotalApprovedByBudgetId(
        //             budget_id,
        //         );

        //     if (body.allocated_amount < totalApprovedExpenses) {
        //         throw new BadRequestException(
        //             this.i18nService.translate(
        //                 'budgets.CANNOT_REDUCE_BELOW_EXPENSES',
        //             ),
        //         );
        //     }
        // }

        await this.budgetRepository.updateById(budget_id, {
            allocated_amount: body.allocated_amount ?? budget.allocated_amount,
            start_date: body.start_date
                ? new Date(body.start_date)
                : budget.start_date,
            end_date: body.end_date ? new Date(body.end_date) : budget.end_date,
        });

        // TODO: كتابة التعديل في الـ Activity Log

        const updatedBudget = await this.budgetRepository.findById(budget_id, {
            relations: {
                department: true,
                project: true,
                creator: true,
            },
        });

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

            // TODO:
            // approved_expenses: 0,
            // remaining_budget: Number(updatedBudget.allocated_amount),
            // utilization_percentage: 0,
            // budget_variance: Number(updatedBudget.allocated_amount),
            // utilization_level: 'low',
            // is_overrun: false,
        };

        return plainToInstance(BudgetResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
