import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { BudgetRepository } from '../repositories/budget.repository';
import { DepartmentRepository } from 'src/departments/repositories/department.repository';
import { ProjectRepository } from 'src/projects/repositories/project.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { CreateBudgetDto } from '../dtos/create-budget.dto';
import { BudgetResponseDto } from '../dtos/budget-response.dto';
import { calculateBudgetMetrics } from '../utils/budget-calculator.util';
import { ExpenseMetricsQuery } from 'src/expenses/queries/expense-metrics.query';
import { EntityType, ActionType } from 'src/common/enums';
import { ActivityLogRepository } from 'src/activity-logs/repositories/activity-log.repository';

@Injectable()
export class CreateBudgetUseCase {
    constructor(
        private readonly budgetRepository: BudgetRepository,
        private readonly departmentRepository: DepartmentRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
        private readonly expenseMetricsQuery: ExpenseMetricsQuery,
        private readonly activityLogRepository: ActivityLogRepository,
    ) {}

    async execute(
        body: CreateBudgetDto,
        user_id: string,
    ): Promise<BudgetResponseDto> {
        if (
            (body.department_id && body.project_id) ||
            (!body.department_id && !body.project_id)
        ) {
            throw new BadRequestException(
                this.i18nService.translate('budgets.EXACTLY_ONE_SCOPE_REQUIRED'),
            );
        }

        const startDate = new Date(body.start_date);
        const endDate = new Date(body.end_date);

        if (endDate <= startDate) {
            throw new BadRequestException(
                this.i18nService.translate('budgets.END_DATE_MUST_BE_AFTER_START_DATE'),
            );
        }

        let department = null;
        let project = null;

        if (body.department_id) {
            department = await this.departmentRepository.findById(body.department_id);
            if (!department) {
                throw new NotFoundException(
                    this.i18nService.translate('departments.DEPARTMENT_NOT_FOUND'),
                );
            }
        } else if (body.project_id) {
            project = await this.projectRepository.findById(body.project_id);
            if (!project) {
                throw new NotFoundException(
                    this.i18nService.translate('projects.PROJECT_NOT_FOUND'),
                );
            }
        }

        const creator = await this.userRepository.findById(user_id);
        if (!creator) {
            throw new NotFoundException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        const newBudget = await this.budgetRepository.create({
            department_id: body.department_id,
            project_id: body.project_id,
            allocated_amount: body.allocated_amount,
            start_date: startDate,
            end_date: endDate,
            created_by: user_id,
        });

        const totalApproved = await this.expenseMetricsQuery.getTotalApprovedByScope(
            newBudget.start_date,
            newBudget.end_date,
            newBudget.department_id,
            newBudget.project_id,
        );

        const metrics = calculateBudgetMetrics(
            Number(newBudget.allocated_amount),
            totalApproved,
        );

        const responseData = {
            budget_id: newBudget.budget_id,
            department: department
                ? {
                    id: department.department_id,
                    name: department.department_name,
                }
                : null,
            project: project
                ? { id: project.project_id, name: project.project_name }
                : null,
            allocated_amount: Number(newBudget.allocated_amount),
            start_date: newBudget.start_date,
            end_date: newBudget.end_date,
            ...metrics,
            created_by: {
                user_id: creator.user_id,
                full_name: creator.full_name,
            },
        };

        await this.activityLogRepository.create({
            user_id: user_id,
            action_type: ActionType.BUDGET_CREATED,
            entity_type: EntityType.BUDGET,
            entity_id: newBudget.budget_id,
        });

        return plainToInstance(BudgetResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}