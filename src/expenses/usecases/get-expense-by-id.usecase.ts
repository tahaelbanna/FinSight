import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { ExpenseRepository } from '../repositories/expense.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ExpenseResponseDto } from '../dtos/expense-response.dto';
import { UserRole } from 'src/common/enums';

@Injectable()
export class GetExpenseByIdUseCase {
    constructor(
        private readonly expenseRepository: ExpenseRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        expense_id: string,
        user_id: string,
    ): Promise<ExpenseResponseDto> {
        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser) {
            throw new UnauthorizedException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        const expense = await this.expenseRepository.findById(expense_id, {
            relations: {
                user: true,
                department: true,
                project: true,
                category: true,
                reviewer: true,
                attachments: true,
            },
        });

        if (!expense) {
            throw new NotFoundException(
                this.i18nService.translate('expenses.EXPENSE_NOT_FOUND'),
            );
        }

        if (currentUser.role === UserRole.EMPLOYEE) {
            if (expense.user_id !== currentUser.user_id) {
                throw new ForbiddenException(
                    this.i18nService.translate('auth.FORBIDDEN'),
                );
            }
        } else if (currentUser.role === UserRole.MANAGER) {
            if (expense.department_id !== currentUser.department_id) {
                throw new ForbiddenException(
                    this.i18nService.translate('auth.FORBIDDEN'),
                );
            }
        }

        const responseData = {
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
        };

        return plainToInstance(ExpenseResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
