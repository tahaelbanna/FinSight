import { Injectable } from '@nestjs/common';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';
import { plainToInstance } from 'class-transformer';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ExpenseRepository } from 'src/expenses/repositories/expense.repository';
import { DepartmentRepository } from 'src/departments/repositories/department.repository';
import { BudgetRepository } from 'src/budgets/repositories/budget.repository';
import { GetAnalyticsFilterDto } from '../dtos/get-analytics-filter.dto';
import { DepartmentComparisonResponseDto } from '../dtos/department-comparison-response.dto';
import { ExpenseStatus, UserRole } from 'src/common/enums';
import { I18nService } from 'nestjs-i18n';
import { Budget } from 'src/budgets/schemas/budget.schema';
import { In } from 'typeorm';
import { resolveCurrentUser } from 'src/common/utils/resolve-current-user.util';

@Injectable()
export class GetDepartmentComparisonUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly expenseRepository: ExpenseRepository,
        private readonly departmentRepository: DepartmentRepository,
        private readonly budgetRepository: BudgetRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        query: GetAnalyticsFilterDto,
        user_id: string,
        role?: UserRole,
    ): Promise<DepartmentComparisonResponseDto[]> {
        const currentUser = await resolveCurrentUser(
            this.userRepository,
            user_id,
            role,
            this.i18nService.translate('auth.FORBIDDEN'),
        );
        if (currentUser.role === UserRole.EMPLOYEE) {
            throw new ForbiddenException(
                this.i18nService.translate('auth.FORBIDDEN'),
            );
        }

        // Determine target departments based on RBAC
        let departmentIds: string[] = [];
        if (currentUser.role === UserRole.MANAGER) {
            if (!currentUser.department_id) {
                return [];
            }
            departmentIds = [currentUser.department_id];
        } else if (query.department_id) {
            departmentIds = [query.department_id];
        }

        // Fetch departments with their projects
        const deptQb = this.departmentRepository
            .createQueryBuilder('department')
            .leftJoinAndSelect('department.projects', 'project');

        if (departmentIds.length > 0) {
            deptQb.where('department.department_id IN (:...departmentIds)', {
                departmentIds,
            });
        }

        deptQb.orderBy('department.department_id', 'ASC');
        const departments = await deptQb.getMany();

        if (departments.length === 0) {
            return [];
        }

        const allDeptIds = departments.map((d) => d.department_id);

        // Fetch all approved expenses for these departments in the date range
        // Under Model B: Consolidated spending = OpEx (project_id IS NULL) + CapEx (project_id IS NOT NULL)
        // Grouping by department_id ensures every expense is counted exactly once
        const expenseQb = this.expenseRepository
            .createQueryBuilder('expense')
            .select('expense.department_id', 'department_id')
            .addSelect('COALESCE(SUM(expense.amount), 0)', 'total_approved')
            .where('expense.department_id IN (:...allDeptIds)', {
                allDeptIds,
            })
            .andWhere('expense.status = :status', {
                status: ExpenseStatus.APPROVED,
            });

        if (query.date_from) {
            expenseQb.andWhere('expense.expense_date >= :dateFrom', {
                dateFrom: query.date_from,
            });
        }
        if (query.date_to) {
            expenseQb.andWhere('expense.expense_date <= :dateTo', {
                dateTo: query.date_to,
            });
        }

        const expenseResults = await expenseQb
            .groupBy('expense.department_id')
            .getRawMany();

        const approvedByDeptMap = new Map<string, number>();
        for (const row of expenseResults) {
            approvedByDeptMap.set(row.department_id, Number(row.total_approved));
        }

        // Collect all project IDs belonging to each department
        const allProjectIds: string[] = [];
        const deptProjectMap = new Map<string, string[]>();
        for (const dept of departments) {
            const pids = (dept.projects || []).map((p) => p.project_id);
            deptProjectMap.set(dept.department_id, pids);
            allProjectIds.push(...pids);
        }

        // Fetch direct department budgets (OpEx) and project budgets (CapEx)
        const budgetQb = this.budgetRepository.createQueryBuilder('budget');
        if (allProjectIds.length > 0) {
            budgetQb.where(
                '(budget.department_id IN (:...allDeptIds) OR budget.project_id IN (:...allProjectIds))',
                { allDeptIds, allProjectIds },
            );
        } else {
            budgetQb.where('budget.department_id IN (:...allDeptIds)', {
                allDeptIds,
            });
        }

        const budgets = await budgetQb.getMany();

        // Organize budgets by department
        const budgetsByDeptMap = new Map<string, Budget[]>();
        for (const budget of budgets) {
            if (budget.department_id) {
                const list = budgetsByDeptMap.get(budget.department_id) || [];
                list.push(budget);
                budgetsByDeptMap.set(budget.department_id, list);
            } else if (budget.project_id) {
                // Find which department owns this project
                for (const [deptId, pids] of deptProjectMap.entries()) {
                    if (pids.includes(budget.project_id)) {
                        const list = budgetsByDeptMap.get(deptId) || [];
                        list.push(budget);
                        budgetsByDeptMap.set(deptId, list);
                        break;
                    }
                }
            }
        }

        // Compute metrics per department
        const formatted = departments.map((dept) => {
            const deptBudgets = budgetsByDeptMap.get(dept.department_id) || [];
            let totalAuthorizedBudget = 0;
            for (const b of deptBudgets) {
                totalAuthorizedBudget += Number(b.allocated_amount);
            }

            const totalApproved = approvedByDeptMap.get(dept.department_id) || 0;
            const allocatedBudget = Number(totalAuthorizedBudget.toFixed(2));
            const approvedSpending = Number(totalApproved.toFixed(2));

            const utilizationPercentage =
                allocatedBudget > 0
                    ? Number(
                          ((approvedSpending / allocatedBudget) * 100).toFixed(
                              2,
                          ),
                      )
                    : null;

            const isOverrun = approvedSpending > allocatedBudget;

            return {
                department: {
                    department_id: dept.department_id,
                    department_name: dept.department_name,
                },
                totalApproved: approvedSpending,
                allocatedBudget,
                utilizationPercentage,
                isOverrun,
            };
        });

        return plainToInstance(DepartmentComparisonResponseDto, formatted, {
            excludeExtraneousValues: true,
        });
    }
}

