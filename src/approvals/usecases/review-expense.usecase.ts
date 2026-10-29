import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { DataSource } from 'typeorm';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { ConflictException } from 'src/common/error-handling/custom-exceptions/conflict.exception';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';

import { ExpenseRepository } from 'src/expenses/repositories/expense.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ReviewExpenseDto } from '../dtos/review-expense.dto';
import { ExpenseResponseDto } from 'src/expenses/dtos/expense-response.dto';
import { ExpenseStatus, UserRole } from 'src/common/enums';
import { Expense } from 'src/expenses/schemas/expense.schema';
import { ActivityLog } from 'src/activity-logs/schemas/activity-log.schema';
import { ActionType, EntityType } from 'src/common/enums';
@Injectable()
export class ReviewExpenseUseCase {
    constructor(
        private readonly expenseRepository: ExpenseRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(
        expense_id: string,
        body: ReviewExpenseDto,
        manager_id: string,
    ): Promise<ExpenseResponseDto> {
        const manager = await this.userRepository.findById(manager_id);
        if (
            !manager ||
            manager.role !== UserRole.MANAGER ||
            !manager.department_id
        ) {
            throw new UnauthorizedException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        const expense = await this.expenseRepository.findById(expense_id);
        if (!expense) {
            throw new NotFoundException(
                this.i18nService.translate('expenses.EXPENSE_NOT_FOUND'),
            );
        }

        if (expense.department_id !== manager.department_id) {
            throw new ForbiddenException(
                this.i18nService.translate('auth.FORBIDDEN'),
            );
        }

        if (expense.status !== ExpenseStatus.PENDING) {
            throw new ConflictException(
                this.i18nService.translate('expenses.EXPENSE_NOT_PENDING'),
            );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const updateResult = await queryRunner.manager.update(
                Expense,
                { expense_id, status: ExpenseStatus.PENDING },
                {
                    status: body.decision,
                    reviewer_id: manager.user_id,
                    reviewed_at: new Date(),
                    review_comment: body.comment || null,
                },
            );

            if (updateResult.affected === 0) {
                throw new ConflictException(
                    this.i18nService.translate(
                        'expenses.EXPENSE_ALREADY_REVIEWED',
                    ),
                );
            }

            await queryRunner.manager.insert(ActivityLog, {
                user_id: manager.user_id,
                action_type:
                    body.decision === ExpenseStatus.APPROVED
                        ? ActionType.EXPENSE_APPROVED
                        : ActionType.EXPENSE_REJECTED,
                entity_type: EntityType.EXPENSE,
                entity_id: expense_id,
            });
            // TODO: إرسال إشعار للموظف

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        const updatedExpense = await this.expenseRepository.findById(
            expense_id,
            {
                relations: {
                    user: true,
                    department: true,
                    project: true,
                    category: true,
                    reviewer: true,
                    attachments: true,
                },
            },
        );

        const responseData = {
            expense_id: updatedExpense.expense_id,
            submitted_by: {
                user_id: updatedExpense.user.user_id,
                full_name: updatedExpense.user.full_name,
            },
            department: {
                department_id: updatedExpense.department.department_id,
                department_name: updatedExpense.department.department_name,
            },
            project: updatedExpense.project
                ? {
                      project_id: updatedExpense.project.project_id,
                      project_name: updatedExpense.project.project_name,
                  }
                : null,
            amount: Number(updatedExpense.amount),
            category: {
                category_id: updatedExpense.category.category_id,
                category_name: updatedExpense.category.category_name,
            },
            description: updatedExpense.description,
            expense_date: updatedExpense.expense_date,
            status: updatedExpense.status,
            reviewer: {
                user_id: updatedExpense.reviewer.user_id,
                full_name: updatedExpense.reviewer.full_name,
            },
            review_comment: updatedExpense.review_comment,
            reviewed_at: updatedExpense.reviewed_at,
            attachments:
                updatedExpense.attachments?.map((att) => ({
                    attachment_id: att.attachment_id,
                    file_name: att.file_name,
                    file_path: att.file_path,
                })) || [],
            submitted_at: updatedExpense.submitted_at,
        };

        return plainToInstance(ExpenseResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
