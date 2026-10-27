import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
    FindOptionsWhere,
    LessThanOrEqual,
    MoreThanOrEqual,
    Between,
} from 'typeorm';
import { UnauthorizedException } from '../../common/error-handling/custom-exceptions/unauthorized.exception';
import { I18nService } from 'nestjs-i18n';
import { PaginatedResult } from 'src/common/data-access';
import { ExpenseRepository } from '../repositories/expense.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { GetAllExpensesDto } from '../dtos/get-all-expenses.dto';
import { ExpenseResponseDto } from '../dtos/expense-response.dto';
import { ExpenseSortBy, SortOrder } from 'src/common/enums';
import { Expense } from '../schemas/expense.schema';
import { UserRole } from 'src/common/enums';

@Injectable()
export class GetAllExpensesUseCase {
    constructor(
        private readonly expenseRepository: ExpenseRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        query: GetAllExpensesDto,
        user_id: string,
    ): Promise<PaginatedResult<ExpenseResponseDto>> {
        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser) {
            throw new UnauthorizedException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        const where: FindOptionsWhere<Expense> = {};

        if (currentUser.role === UserRole.EMPLOYEE) {
            where.user_id = currentUser.user_id;
        } else if (currentUser.role === UserRole.MANAGER) {
            where.department_id = currentUser.department_id;
            if (query.submitted_by) where.user_id = query.submitted_by;
        } else {
            if (query.department_id) where.department_id = query.department_id;
            if (query.submitted_by) where.user_id = query.submitted_by;
        }


        if (query.status) where.status = query.status;
        if (query.category_id) where.category_id = query.category_id;
        if (query.project_id) where.project_id = query.project_id;

        if (query.date_from && query.date_to) {
            where.expense_date = Between(
                new Date(query.date_from),
                new Date(query.date_to),
            );
        } else if (query.date_from) {
            where.expense_date = MoreThanOrEqual(new Date(query.date_from));
        } else if (query.date_to) {
            where.expense_date = LessThanOrEqual(new Date(query.date_to));
        }

        if (query.min_amount !== undefined && query.max_amount !== undefined) {
            where.amount = Between(query.min_amount, query.max_amount);
        } else if (query.min_amount !== undefined) {
            where.amount = MoreThanOrEqual(query.min_amount);
        } else if (query.max_amount !== undefined) {
            where.amount = LessThanOrEqual(query.max_amount);
        }

        const sortBy = query.sort_by || ExpenseSortBy.SUBMITTED_AT;
        const sortOrder = query.sort_order || SortOrder.DESC;
        const order = { [sortBy]: sortOrder };

        const result = await this.expenseRepository.findPaginated({
            where,
            relations: {
                user: true,
                department: true,
                project: true,
                category: true,
                reviewer: true,
                attachments: true,
            },
            page: query.page,
            limit: query.limit,
            order,
        });

        const formattedData = result.data.map((expense) => ({
            expense_id: expense.expense_id,
            submitted_by: {
                user_id: expense.user.user_id,
                full_name: expense.user.full_name,
            },
            department: {
                department_id: expense.department.department_id,
                department_name: expense.department.department_name,
            },
            project: expense.project
                ? {
                    project_id: expense.project.project_id,
                    project_name: expense.project.project_name,
                }
                : null,
            amount: Number(expense.amount),
            category: {
                category_id: expense.category.category_id,
                category_name: expense.category.category_name,
            },
            description: expense.description,
            expense_date: expense.expense_date,
            status: expense.status,
            reviewer: expense.reviewer
                ? {
                    user_id: expense.reviewer.user_id,
                    full_name: expense.reviewer.full_name,
                }
                : null,
            review_comment: expense.review_comment,
            reviewed_at: expense.reviewed_at,
            attachments:
                expense.attachments?.map((att) => ({
                    attachment_id: att.attachment_id,
                    file_name: att.file_name,
                    file_path: att.file_path,
                })) || [],
            submitted_at: expense.submitted_at,
        }));

        return {
            ...result,
            data: plainToInstance(ExpenseResponseDto, formattedData, {
                excludeExtraneousValues: true,
            }),
        };
    }
}
