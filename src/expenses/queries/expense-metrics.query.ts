import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Expense } from '../schemas/expense.schema';
import { ExpenseStatus } from '../../common/enums';

@Injectable()
export class ExpenseMetricsQuery {
    constructor(
        @InjectRepository(Expense)
        private readonly expenseRepo: Repository<Expense>,
    ) {}

    private buildBaseScopeQuery(
        startDate: Date,
        endDate: Date,
        departmentId?: string,
        projectId?: string,
    ): SelectQueryBuilder<Expense> {
        const query = this.expenseRepo
            .createQueryBuilder('expense')
            .where('expense.expense_date >= :startDate', { startDate })
            .andWhere('expense.expense_date <= :endDate', { endDate });

        if (projectId) {
            query.andWhere('expense.project_id = :projectId', { projectId });
        } else if (departmentId) {
            query.andWhere('expense.department_id = :departmentId', {
                departmentId,
            });
        }

        return query;
    }

    async getTotalApprovedByScope(
        startDate: Date,
        endDate: Date,
        departmentId?: string,
        projectId?: string,
    ): Promise<number> {
        const query = this.buildBaseScopeQuery(
            startDate,
            endDate,
            departmentId,
            projectId,
        );

        query
            .select('SUM(expense.amount)', 'total')
            .andWhere('expense.status = :status', {
                status: ExpenseStatus.APPROVED,
            });

        const result = await query.getRawOne();
        return Number(result?.total || 0);
    }

    async getRecentExpensesByScope(
        startDate: Date,
        endDate: Date,
        limit: number,
        departmentId?: string,
        projectId?: string,
    ): Promise<Expense[]> {
        const query = this.buildBaseScopeQuery(
            startDate,
            endDate,
            departmentId,
            projectId,
        );

        query
            .leftJoinAndSelect('expense.category', 'category')
            .orderBy('expense.expense_date', 'DESC')
            .take(limit);

        return query.getMany();
    }
}
