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

@Injectable()
export class CreateBudgetUseCase {
    constructor(
        private readonly budgetRepository: BudgetRepository,
        private readonly departmentRepository: DepartmentRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
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
                this.i18nService.translate(
                    'budgets.EXACTLY_ONE_SCOPE_REQUIRED',
                ),
            );
        }

        const startDate = new Date(body.start_date);
        const endDate = new Date(body.end_date);
        if (endDate <= startDate) {
            throw new BadRequestException(
                this.i18nService.translate(
                    'budgets.END_DATE_MUST_BE_AFTER_START_DATE',
                ),
            );
        }

        let department = null;
        let project = null;

        if (body.department_id) {
            department = await this.departmentRepository.findById(
                body.department_id,
            );
            if (!department) {
                throw new NotFoundException(
                    this.i18nService.translate(
                        'departments.DEPARTMENT_NOT_FOUND',
                    ),
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

        // TODO: كتابة السجل في الـ Activity Log (سيتم ربطها لاحقاً عند بناء موديول الـ Logs)

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

            // TODO:
            // approved_expenses: 0,
            // remaining_budget: Number(newBudget.allocated_amount),
            // utilization_percentage: 0,
            // budget_variance: Number(newBudget.allocated_amount),
            // utilization_level: 'low',
            // is_overrun: false,

            created_by: {
                user_id: creator.user_id,
                full_name: creator.full_name,
            },
        };

        return plainToInstance(BudgetResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
