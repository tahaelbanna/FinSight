import { Injectable } from '@nestjs/common';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { plainToInstance } from 'class-transformer';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ExpenseRepository } from 'src/expenses/repositories/expense.repository';
import { GetAnalyticsFilterDto } from '../dtos/get-analytics-filter.dto';
import { DepartmentComparisonResponseDto } from '../dtos/department-comparison-response.dto';
import { ExpenseStatus, UserRole } from 'src/common/enums';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class GetDepartmentComparisonUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly expenseRepository: ExpenseRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<DepartmentComparisonResponseDto[]> {
        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser || currentUser.role === UserRole.EMPLOYEE) {
            throw new ForbiddenException(
                this.i18nService.translate('auth.FORBIDDEN'),
            );
        }

        const qb = this.expenseRepository
            .createQueryBuilder('expense')
            .innerJoin('expense.department', 'dept')
            .select('dept.department_id', 'department_id')
            .addSelect('dept.department_name', 'department_name')
            .addSelect('SUM(expense.amount)', 'total')
            .where('expense.status = :status', {
                status: ExpenseStatus.APPROVED,
            });

        if (currentUser.role === UserRole.MANAGER) {
            qb.andWhere('expense.department_id = :deptId', {
                deptId: currentUser.department_id,
            });
        }

        if (query.date_from)
            qb.andWhere('expense.expense_date >= :dateFrom', {
                dateFrom: query.date_from,
            });
        if (query.date_to)
            qb.andWhere('expense.expense_date <= :dateTo', {
                dateTo: query.date_to,
            });

        const result = await qb
            .groupBy('dept.department_id')
            .addGroupBy('dept.department_name')
            .getRawMany();

        const formatted = result.map((r) => ({
            department_id: r.department_id,
            department_name: r.department_name,
            total: Number(r.total),
        }));
        return plainToInstance(DepartmentComparisonResponseDto, formatted, {
            excludeExtraneousValues: true,
        });
    }
}
