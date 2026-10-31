import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ExpenseRepository } from 'src/expenses/repositories/expense.repository';
import { BudgetRepository } from 'src/budgets/repositories/budget.repository';
import { GetAnalyticsFilterDto } from '../dtos/get-analytics-filter.dto';
import { AnalyticsSummaryResponseDto } from '../dtos/analytics-summary-response.dto';
import { ExpenseStatus, UserRole } from 'src/common/enums';

@Injectable()
export class GetSummaryUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly expenseRepository: ExpenseRepository,
        private readonly budgetRepository: BudgetRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<AnalyticsSummaryResponseDto> {
        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser)
            throw new UnauthorizedException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );

        let targetDepartmentId = query.department_id;
        let targetUserId = null;

        if (currentUser.role === UserRole.EMPLOYEE) {
            targetUserId = currentUser.user_id; 
        } else if (currentUser.role === UserRole.MANAGER) {
            targetDepartmentId = currentUser.department_id;
        }

        const expenseQb = this.expenseRepository.createQueryBuilder('expense');

        if (targetUserId)
            expenseQb.andWhere('expense.user_id = :uid', { uid: targetUserId });
        if (targetDepartmentId)
            expenseQb.andWhere('expense.department_id = :deptId', {
                deptId: targetDepartmentId,
            });
        if (query.project_id)
            expenseQb.andWhere('expense.project_id = :projId', {
                projId: query.project_id,
            });
        if (query.date_from)
            expenseQb.andWhere('expense.expense_date >= :dateFrom', {
                dateFrom: query.date_from,
            });
        if (query.date_to)
            expenseQb.andWhere('expense.expense_date <= :dateTo', {
                dateTo: query.date_to,
            });

        const approvedQb = expenseQb
            .clone()
            .andWhere('expense.status = :status', {
                status: ExpenseStatus.APPROVED,
            });
        const pendingQb = expenseQb
            .clone()
            .andWhere('expense.status = :status', {
                status: ExpenseStatus.PENDING,
            });

        const approvedResult = await approvedQb
            .select('SUM(expense.amount)', 'total')
            .getRawOne();
        const pendingResult = await pendingQb
            .select('SUM(expense.amount)', 'total')
            .getRawOne();

        const totalApproved = Number(approvedResult?.total || 0);
        const totalPending = Number(pendingResult?.total || 0);

        let totalBudget = 0;
        if (currentUser.role !== UserRole.EMPLOYEE) {
            const budgetQb = this.budgetRepository.createQueryBuilder('budget');
            if (targetDepartmentId)
                budgetQb.andWhere('budget.department_id = :deptId', {
                    deptId: targetDepartmentId,
                });
            if (query.project_id)
                budgetQb.andWhere('budget.project_id = :projId', {
                    projId: query.project_id,
                });

            const budgetResult = await budgetQb
                .select('SUM(budget.allocated_amount)', 'total')
                .getRawOne();
            totalBudget = Number(budgetResult?.total || 0);
        }

        const remainingBudget =
            totalBudget > 0 ? totalBudget - totalApproved : 0;
        const utilizationPercentage =
            totalBudget > 0
                ? Number(((totalApproved / totalBudget) * 100).toFixed(2))
                : 0;

        return plainToInstance(
            AnalyticsSummaryResponseDto,
            {
                total_budget: totalBudget,
                total_approved_expenses: totalApproved,
                total_pending_expenses: totalPending,
                remaining_budget: remainingBudget,
                utilization_percentage: utilizationPercentage,
            },
            { excludeExtraneousValues: true },
        );
    }
}
