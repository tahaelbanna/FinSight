import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { plainToInstance } from 'class-transformer';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ExpenseRepository } from 'src/expenses/repositories/expense.repository';
import { GetAnalyticsFilterDto } from '../dtos/get-analytics-filter.dto';
import { CategoryBreakdownResponseDto } from '../dtos/category-breakdown-response.dto';
import { ExpenseStatus, UserRole } from 'src/common/enums';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class GetCategoryBreakdownUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly expenseRepository: ExpenseRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<CategoryBreakdownResponseDto[]> {
        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser)
            throw new UnauthorizedException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );

        const qb = this.expenseRepository
            .createQueryBuilder('expense')
            .innerJoin('expense.category', 'cat')
            .select('cat.category_id', 'category_id')
            .addSelect('cat.category_name', 'category_name')
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

        if (query.project_id)
            qb.andWhere('expense.project_id = :projId', {
                projId: query.project_id,
            });
        if (query.date_from)
            qb.andWhere('expense.expense_date >= :dateFrom', {
                dateFrom: query.date_from,
            });
        if (query.date_to)
            qb.andWhere('expense.expense_date <= :dateTo', {
                dateTo: query.date_to,
            });

        const result = await qb
            .groupBy('cat.category_id')
            .addGroupBy('cat.category_name')
            .getRawMany();

        const formatted = result.map((r) => ({
            category_id: r.category_id,
            category_name: r.category_name,
            total: Number(r.total),
        }));
        return plainToInstance(CategoryBreakdownResponseDto, formatted, {
            excludeExtraneousValues: true,
        });
    }
}
