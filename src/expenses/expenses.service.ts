import { Injectable } from '@nestjs/common';
import { GetAllCategoriesUseCase } from './usecases/get-all-categories.usecase';
import { SubmitExpenseUseCase } from './usecases/submit-expense.usecase';
import { GetAllExpensesUseCase } from './usecases/get-all-expenses.usecase';
import { GetExpenseByIdUseCase } from './usecases/get-expense-by-id.usecase';
import { DownloadAttachmentUseCase } from './usecases/download-attachment.usecase';

import { CategoryResponseDto } from './dtos/category-response.dto';
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { ExpenseResponseDto } from './dtos/expense-response.dto';
import { GetAllExpensesDto } from './dtos/get-all-expenses.dto';
import { MulterFile } from 'src/files-upload/types/file-type.types';
import { PaginatedResult } from 'src/common/data-access';
import { ExpenseAttachment } from './schemas/expense-attachment.schema';

@Injectable()
export class ExpensesService {
    constructor(
        private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase,
        private readonly submitExpenseUseCase: SubmitExpenseUseCase,
        private readonly getAllExpensesUseCase: GetAllExpensesUseCase,
        private readonly getExpenseByIdUseCase: GetExpenseByIdUseCase,
        private readonly downloadAttachmentUseCase: DownloadAttachmentUseCase,
    ) {}

    async getAllCategories(): Promise<CategoryResponseDto[]> {
        return this.getAllCategoriesUseCase.execute();
    }

    async submitExpense(
        body: CreateExpenseDto,
        receipts: MulterFile[],
        user_id: string,
    ): Promise<ExpenseResponseDto> {
        return this.submitExpenseUseCase.execute(body, receipts, user_id);
    }

    async getAllExpenses(
        query: GetAllExpensesDto,
        user_id: string,
    ): Promise<PaginatedResult<ExpenseResponseDto>> {
        return this.getAllExpensesUseCase.execute(query, user_id);
    }

    async getExpenseById(
        expense_id: string,
        user_id: string,
    ): Promise<ExpenseResponseDto> {
        return this.getExpenseByIdUseCase.execute(expense_id, user_id);
    }

    async downloadAttachment(
        expense_id: string,
        attachment_id: string,
        user_id: string,
    ): Promise<ExpenseAttachment> {
        return this.downloadAttachmentUseCase.execute(expense_id, attachment_id, user_id);
    }
}