import {
    Injectable,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { BudgetRepository } from '../repositories/budget.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { BudgetResponseDto } from '../dtos/budget-response.dto';
import { UserRole } from 'src/common/enums';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class GetBudgetByIdUseCase {
    constructor(
        private readonly budgetRepository: BudgetRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        budget_id: string,
        user_id: string,
    ): Promise<BudgetResponseDto> {
        const budget = await this.budgetRepository.findById(budget_id, {
            relations: {
                department: true,
                project: true,
                creator: true,
            },
        });

        if (!budget) {
            throw new NotFoundException(
                this.i18nService.translate('budgets.BUDGET_NOT_FOUND'),
            );
        }

        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser) {
            throw new UnauthorizedException();
        }

        if (
            currentUser.role !== UserRole.ADMIN &&
            currentUser.role !== UserRole.FINANCE_OFFICER
        ) {
            const isDepartmentMatch =
                budget.department_id === currentUser.department_id;
            const isProjectMatch =
                budget.project?.department_id === currentUser.department_id;

            if (!isDepartmentMatch && !isProjectMatch) {
                throw new ForbiddenException(
                    this.i18nService.translate(
                        'budgets.FORBIDDEN_BUDGET_ACCESS',
                    ),
                );
            }
        }

        const responseData = {
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

            // TODO: 
            // approved_expenses: 0,
            // remaining_budget: Number(budget.allocated_amount),
            // utilization_percentage: 0,
            // budget_variance: Number(budget.allocated_amount),
            // utilization_level: 'low',
            // is_overrun: false,
            // recent_expenses: [], 
        };

        return plainToInstance(BudgetResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
