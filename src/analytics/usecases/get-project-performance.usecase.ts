import { Injectable } from '@nestjs/common';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ProjectRepository } from 'src/projects/repositories/project.repository';
import { ExpenseRepository } from 'src/expenses/repositories/expense.repository';
import { GetAnalyticsFilterDto } from '../dtos/get-analytics-filter.dto';
import { ProjectPerformanceResponseDto } from '../dtos/project-performance-response.dto';
import { ExpenseStatus, UserRole } from 'src/common/enums';
import { FindOptionsWhere } from 'typeorm';
import { Project } from 'src/projects/schemas/project.schema';

@Injectable()
export class GetProjectPerformanceUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly expenseRepository: ExpenseRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<ProjectPerformanceResponseDto[]> {
        const currentUser = await this.userRepository.findById(user_id);

        if (!currentUser || currentUser.role === UserRole.EMPLOYEE) {
            throw new ForbiddenException(
                this.i18nService.translate('auth.FORBIDDEN'),
            );
        }

        const where: FindOptionsWhere<Project> = {};

        if (currentUser.role === UserRole.MANAGER) {
            where.department_id = currentUser.department_id;
        } else if (query.department_id) {
            where.department_id = query.department_id;
        }

        if (query.project_id) {
            where.project_id = query.project_id;
        }

        const projects = await this.projectRepository.find({
            where,
            relations: { budgets: true },
        });

        const formatted = await Promise.all(
            projects.map(async (project) => {
                const allocated_budget = project.budgets.reduce(
                    (sum, b) => sum + Number(b.allocated_amount),
                    0,
                );

                const expenseQb = this.expenseRepository
                    .createQueryBuilder('expense')
                    .where('expense.project_id = :projectId', {
                        projectId: project.project_id,
                    })
                    .andWhere('expense.status = :status', {
                        status: ExpenseStatus.APPROVED,
                    });

                if (query.date_from)
                    expenseQb.andWhere('expense.expense_date >= :dateFrom', {
                        dateFrom: query.date_from,
                    });
                if (query.date_to)
                    expenseQb.andWhere('expense.expense_date <= :dateTo', {
                        dateTo: query.date_to,
                    });

                const result = await expenseQb
                    .select('SUM(expense.amount)', 'total')
                    .getRawOne();
                const total_spent = Number(result?.total || 0);

                const remaining_budget = allocated_budget - total_spent;
                const utilization_percentage =
                    allocated_budget > 0
                        ? Number(
                              ((total_spent / allocated_budget) * 100).toFixed(
                                  2,
                              ),
                          )
                        : 0;

                return {
                    project_id: project.project_id,
                    project_name: project.project_name,
                    allocated_budget,
                    total_spent,
                    remaining_budget,
                    utilization_percentage,
                };
            }),
        );

        return plainToInstance(ProjectPerformanceResponseDto, formatted, {
            excludeExtraneousValues: true,
        });
    }
}
