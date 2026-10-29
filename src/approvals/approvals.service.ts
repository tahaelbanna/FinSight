import { Injectable } from '@nestjs/common';
import { GetPendingApprovalsUseCase } from './usecases/get-pending-approvals.usecase';
import { ReviewExpenseUseCase } from './usecases/review-expense.usecase';
import { GetPendingApprovalsDto } from './dtos/get-pending-approvals.dto';
import { ReviewExpenseDto } from './dtos/review-expense.dto';
import { ExpenseResponseDto } from 'src/expenses/dtos/expense-response.dto';
import { PaginatedResult } from 'src/common/data-access';

@Injectable()
export class ApprovalsService {
    constructor(
        private readonly getPendingApprovalsUseCase: GetPendingApprovalsUseCase,
        private readonly reviewExpenseUseCase: ReviewExpenseUseCase,
    ) {}

    async getPendingApprovals(
        query: GetPendingApprovalsDto,
        user_id: string,
    ): Promise<PaginatedResult<ExpenseResponseDto>> {
        return this.getPendingApprovalsUseCase.execute(query, user_id);
    }

    async reviewExpense(
        expense_id: string,
        body: ReviewExpenseDto,
        manager_id: string,
    ): Promise<ExpenseResponseDto> {
        return this.reviewExpenseUseCase.execute(expense_id, body, manager_id);
    }
}