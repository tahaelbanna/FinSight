import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ExpenseRepository } from 'src/expenses/repositories/expense.repository';
import { GetAnalyticsFilterDto } from '../dtos/get-analytics-filter.dto';
import { MonthlyTrendResponseDto } from '../dtos/monthly-trend-response.dto';
import { ExpenseStatus, UserRole } from 'src/common/enums';

@Injectable()
export class GetMonthlyTrendUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly expenseRepository: ExpenseRepository,
    ) {}

    async execute(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<MonthlyTrendResponseDto[]> {
        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser) throw new UnauthorizedException('User not found');

        const qb = this.expenseRepository
            .createQueryBuilder('expense')
            .select("TO_CHAR(expense.expense_date, 'YYYY-MM')", 'month')
            .addSelect('SUM(expense.amount)', 'total')
            .where('expense.status = :status', {
                status: ExpenseStatus.APPROVED,
            });

        if (currentUser.role === UserRole.EMPLOYEE) {
            qb.andWhere('expense.user_id = :uid', { uid: currentUser.user_id });
        } else if (currentUser.role === UserRole.MANAGER) {
            qb.andWhere('expense.department_id = :deptId', {
                deptId: currentUser.department_id,
            });
        } else if (query.department_id) {
            qb.andWhere('expense.department_id = :deptId', {
                deptId: query.department_id,
            });
        }

        if (query.project_id) {
            qb.andWhere('expense.project_id = :projId', {
                projId: query.project_id,
            });
        }

        if (query.date_from) {
            qb.andWhere('expense.expense_date >= :dateFrom', {
                dateFrom: query.date_from,
            });
        }

        if (query.date_to) {
            qb.andWhere('expense.expense_date <= :dateTo', {
                dateTo: query.date_to,
            });
        }

        const result = await qb
            .groupBy('month')
            .orderBy('month', 'ASC')
            .getRawMany();

        const formatted = result.map((r) => ({
            month: r.month,
            total: Number(r.total),
        }));

        return plainToInstance(MonthlyTrendResponseDto, formatted, {
            excludeExtraneousValues: true,
        });
    }
}
