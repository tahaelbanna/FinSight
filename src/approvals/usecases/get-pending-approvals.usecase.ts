import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { FindOptionsWhere } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { PaginatedResult } from 'src/common/data-access';
import { ExpenseRepository } from 'src/expenses/repositories/expense.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { GetPendingApprovalsDto } from '../dtos/get-pending-approvals.dto';
import { ExpenseResponseDto } from 'src/expenses/dtos/expense-response.dto';
import { Expense } from 'src/expenses/schemas/expense.schema';
import {
    ExpenseStatus,
    ExpenseSortBy,
    SortOrder,
    UserRole,
} from 'src/common/enums';

@Injectable()
export class GetPendingApprovalsUseCase {
    constructor(
        private readonly expenseRepository: ExpenseRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        query: GetPendingApprovalsDto,
        user_id: string,
    ): Promise<PaginatedResult<ExpenseResponseDto>> {
        const currentUser = await this.userRepository.findById(user_id);
        if (
            !currentUser ||
            currentUser.role !== UserRole.MANAGER ||
            !currentUser.department_id
        ) {
            throw new UnauthorizedException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        const where: FindOptionsWhere<Expense> = {
            status: ExpenseStatus.PENDING,
            department_id: currentUser.department_id,
        };

        if (query.category_id) where.category_id = query.category_id;
        if (query.project_id) where.project_id = query.project_id;

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
