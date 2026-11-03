import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { BudgetRepository } from '../repositories/budget.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ExpenseRepository } from 'src/expenses/repositories/expense.repository';
import { ProjectRepository } from 'src/projects/repositories/project.repository';
import { BudgetSummaryResponseDto } from '../dtos/budget-summary-response.dto';
import { ExpenseStatus, UserRole } from 'src/common/enums';
import { resolveCurrentUser } from 'src/common/utils/resolve-current-user.util';

@Injectable()
export class GetBudgetSummaryUseCase {
    constructor(
        private readonly budgetRepository: BudgetRepository,
        private readonly userRepository: UserRepository,
        private readonly expenseRepository: ExpenseRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        user_id: string,
        role?: UserRole,
    ): Promise<BudgetSummaryResponseDto> {
        const currentUser = await resolveCurrentUser(
            this.userRepository,
            user_id,
            role,
            this.i18nService.translate('users.USER_NOT_FOUND'),
        );

        let targetDepartmentId: string | null = null;
        if (
            currentUser.role === UserRole.MANAGER ||
            currentUser.role === UserRole.EMPLOYEE
        ) {
            targetDepartmentId = currentUser.department_id || null;
            if (!targetDepartmentId) {
                const emptyMetrics = {
                    total_budget: 0,
                    total_approved_spend: 0,
                    remaining_budget: 0,
                    utilization_percentage: 0,
                    total_budgets_count: 0,
                    is_overrun: false,
                };
                return plainToInstance(
                    BudgetSummaryResponseDto,
                    {
                        all_allocations: emptyMetrics,
                        department_opex: emptyMetrics,
                        project_capex: emptyMetrics,
                    },
                    { excludeExtraneousValues: true },
                );
            }
        }

        let departmentProjectIds: string[] = [];
        if (targetDepartmentId) {
            const projects = await this.projectRepository.find({
                where: { department_id: targetDepartmentId },
                select: { project_id: true },
            });
            departmentProjectIds = projects.map((p) => p.project_id);
        }

        const opexBudgetQb = this.budgetRepository
            .createQueryBuilder('budget')
            .where('budget.department_id IS NOT NULL');

        if (targetDepartmentId) {
            opexBudgetQb.andWhere('budget.department_id = :deptId', {
                deptId: targetDepartmentId,
            });
        }

        const opexBudgetResult = await opexBudgetQb
            .select('COALESCE(SUM(budget.allocated_amount), 0)', 'total')
            .addSelect('COUNT(budget.budget_id)', 'count')
            .getRawOne();

        const opexAllocated = Number(opexBudgetResult?.total || 0);
        const opexCount = Number(opexBudgetResult?.count || 0);

        const capexBudgetQb = this.budgetRepository
            .createQueryBuilder('budget')
            .where('budget.project_id IS NOT NULL');

        if (targetDepartmentId) {
            if (departmentProjectIds.length > 0) {
                capexBudgetQb.andWhere(
                    'budget.project_id IN (:...departmentProjectIds)',
                    { departmentProjectIds },
                );
            } else {
                capexBudgetQb.andWhere('1=0'); 
            }
        }

        const capexBudgetResult = await capexBudgetQb
            .select('COALESCE(SUM(budget.allocated_amount), 0)', 'total')
            .addSelect('COUNT(budget.budget_id)', 'count')
            .getRawOne();

        const capexAllocated = Number(capexBudgetResult?.total || 0);
        const capexCount = Number(capexBudgetResult?.count || 0);

        const opexExpenseQb = this.expenseRepository
            .createQueryBuilder('expense')
            .where('expense.status = :status', {
                status: ExpenseStatus.APPROVED,
            })
            .andWhere('expense.project_id IS NULL');

        if (targetDepartmentId) {
            opexExpenseQb.andWhere('expense.department_id = :deptId', {
                deptId: targetDepartmentId,
            });
        }

        const opexExpenseResult = await opexExpenseQb
            .select('COALESCE(SUM(expense.amount), 0)', 'total')
            .getRawOne();

        const opexApprovedSpend = Number(opexExpenseResult?.total || 0);

        const capexExpenseQb = this.expenseRepository
            .createQueryBuilder('expense')
            .where('expense.status = :status', {
                status: ExpenseStatus.APPROVED,
            })
            .andWhere('expense.project_id IS NOT NULL');

        if (targetDepartmentId) {
            if (departmentProjectIds.length > 0) {
                capexExpenseQb.andWhere(
                    'expense.project_id IN (:...departmentProjectIds)',
                    { departmentProjectIds },
                );
            } else {
                capexExpenseQb.andWhere('1=0');
            }
        }

        const capexExpenseResult = await capexExpenseQb
            .select('COALESCE(SUM(expense.amount), 0)', 'total')
            .getRawOne();

        const capexApprovedSpend = Number(capexExpenseResult?.total || 0);

        const opexRemaining = Number((opexAllocated - opexApprovedSpend).toFixed(2));
        const opexUtilization =
            opexAllocated > 0
                ? Number(((opexApprovedSpend / opexAllocated) * 100).toFixed(2))
                : 0;

        const capexRemaining = Number((capexAllocated - capexApprovedSpend).toFixed(2));
        const capexUtilization =
            capexAllocated > 0
                ? Number(((capexApprovedSpend / capexAllocated) * 100).toFixed(2))
                : 0;

        const allAllocated = Number((opexAllocated + capexAllocated).toFixed(2));
        const allApprovedSpend = Number((opexApprovedSpend + capexApprovedSpend).toFixed(2));
        const allRemaining = Number((allAllocated - allApprovedSpend).toFixed(2));
        const allUtilization =
            allAllocated > 0
                ? Number(((allApprovedSpend / allAllocated) * 100).toFixed(2))
                : 0;
        const allCount = opexCount + capexCount;

        return plainToInstance(
            BudgetSummaryResponseDto,
            {
                all_allocations: {
                    total_budget: allAllocated,
                    total_approved_spend: allApprovedSpend,
                    remaining_budget: allRemaining,
                    utilization_percentage: allUtilization,
                    total_budgets_count: allCount,
                    is_overrun: allRemaining < 0,
                },
                department_opex: {
                    total_budget: opexAllocated,
                    total_approved_spend: opexApprovedSpend,
                    remaining_budget: opexRemaining,
                    utilization_percentage: opexUtilization,
                    total_budgets_count: opexCount,
                    is_overrun: opexRemaining < 0,
                },
                project_capex: {
                    total_budget: capexAllocated,
                    total_approved_spend: capexApprovedSpend,
                    remaining_budget: capexRemaining,
                    utilization_percentage: capexUtilization,
                    total_budgets_count: capexCount,
                    is_overrun: capexRemaining < 0,
                },
            },
            { excludeExtraneousValues: true },
        );
    }
}
