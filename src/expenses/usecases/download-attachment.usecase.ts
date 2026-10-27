import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { ExpenseRepository } from '../repositories/expense.repository';
import { UserRepository } from 'src/users/repositories/users.repository';
import { UserRole } from 'src/common/enums';
import { ExpenseAttachment } from '../schemas/expense-attachment.schema';

@Injectable()
export class DownloadAttachmentUseCase {
    constructor(
        private readonly expenseRepository: ExpenseRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        expense_id: string,
        attachment_id: string,
        user_id: string,
    ): Promise<ExpenseAttachment> {
        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser) {
            throw new UnauthorizedException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        const expense = await this.expenseRepository.findById(expense_id, {
            relations: { attachments: true },
        });

        if (!expense) {
            throw new NotFoundException(
                this.i18nService.translate('expenses.EXPENSE_NOT_FOUND'),
            );
        }

        if (
            currentUser.role === UserRole.EMPLOYEE &&
            expense.user_id !== currentUser.user_id
        ) {
            throw new ForbiddenException(
                this.i18nService.translate('auth.FORBIDDEN'),
            );
        } else if (
            currentUser.role === UserRole.MANAGER &&
            expense.department_id !== currentUser.department_id
        ) {
            throw new ForbiddenException(
                this.i18nService.translate('auth.FORBIDDEN'),
            );
        }

        const attachment = expense.attachments?.find(
            (att) => att.attachment_id === attachment_id,
        );

        if (!attachment) {
            throw new NotFoundException(
                this.i18nService.translate('expenses.ATTACHMENT_NOT_FOUND'),
            );
        }

        return attachment;
    }
}
