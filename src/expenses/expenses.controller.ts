import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UploadedFiles,
    UseInterceptors,
    Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as https from 'https';

import { ExpensesService } from './expenses.service';
import { CurrentUser, Principal } from 'src/auth/decorators/current-user.decorator';
import { MulterFile } from 'src/files-upload/types/file-type.types';
import { createParseFilePipe } from 'src/common/files/files-validation-factory';

import { CreateExpenseDto } from './dtos/create-expense.dto';
import { GetAllExpensesDto } from './dtos/get-all-expenses.dto';
import { ExpenseResponseDto } from './dtos/expense-response.dto';
import { CategoryResponseDto } from './dtos/category-response.dto';
import { PaginatedResult } from 'src/common/data-access';

@Controller('expenses')
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) {}

    @Get('categories')
    async getCategories(): Promise<CategoryResponseDto[]> {
        return this.expensesService.getAllCategories();
    }

    @Post()
    @UseInterceptors(FilesInterceptor('receipts', 5))
    async submitExpense(
        @Body() body: CreateExpenseDto,
        @UploadedFiles(createParseFilePipe('5MB', ['png', 'jpg', 'jpeg', 'pdf'])) receipts: MulterFile[],
        @CurrentUser() principal: Principal,
    ): Promise<ExpenseResponseDto> {
        return this.expensesService.submitExpense(body, receipts, principal.user.user_id);
    }

    @Get()
    async getAllExpenses(
        @Query() query: GetAllExpensesDto,
        @CurrentUser() principal: Principal,
    ): Promise<PaginatedResult<ExpenseResponseDto>> {
        return this.expensesService.getAllExpenses(query, principal.user.user_id);
    }

    @Get(':expense_id')
    async getExpenseById(
        @Param('expense_id') expense_id: string,
        @CurrentUser() principal: Principal,
    ): Promise<ExpenseResponseDto> {
        return this.expensesService.getExpenseById(expense_id, principal.user.user_id);
    }

    @Get(':expense_id/attachments/:attachment_id')
    async downloadAttachment(
        @Param('expense_id') expense_id: string,
        @Param('attachment_id') attachment_id: string,
        @CurrentUser() principal: Principal,
        @Res() res: Response,
    ) {
        const attachment = await this.expensesService.downloadAttachment(
            expense_id,
            attachment_id,
            principal.user.user_id,
        );

        res.set({
            'Content-Type': attachment.content_type,
            'Content-Disposition': `attachment; filename="${attachment.file_name}"`,
            'Content-Length': attachment.file_size_bytes.toString(),
        });

        https.get(attachment.file_path, (stream) => {
            stream.pipe(res);
        }).on('error', (error) => {
            res.status(500).send({ message: 'Failed to download the file from storage.' });
        });
    }
}