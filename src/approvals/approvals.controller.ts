import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import {
    CurrentUser,
    Principal,
} from 'src/auth/decorators/current-user.decorator';
import { AllowRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { GetPendingApprovalsDto } from './dtos/get-pending-approvals.dto';
import { ReviewExpenseDto } from './dtos/review-expense.dto';
import { ExpenseResponseDto } from 'src/expenses/dtos/expense-response.dto';
import { PaginatedResult } from 'src/common/data-access';

@Controller('approvals')
export class ApprovalsController {
    constructor(private readonly approvalsService: ApprovalsService) {}

    @Get('pending')
    @AllowRoles(UserRole.MANAGER)
    async getPendingApprovals(
        @Query() query: GetPendingApprovalsDto,
        @CurrentUser() principal: Principal,
    ): Promise<PaginatedResult<ExpenseResponseDto>> {
        return this.approvalsService.getPendingApprovals(
            query,
            principal.user.user_id,
        );
    }

    @Patch('expenses/:expense_id/review')
    @AllowRoles(UserRole.MANAGER)
    async reviewExpense(
        @Param('expense_id') expense_id: string,
        @Body() body: ReviewExpenseDto,
        @CurrentUser() principal: Principal,
    ): Promise<ExpenseResponseDto> {
        return this.approvalsService.reviewExpense(
            expense_id,
            body,
            principal.user.user_id,
        );
    }
}
