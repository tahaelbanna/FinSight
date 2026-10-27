import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { GetPendingApprovalsUseCase } from './usecases/get-pending-approvals.usecase';
import { ReviewExpenseUseCase } from './usecases/review-expense.usecase';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [ExpensesModule, UsersModule],
    controllers: [ApprovalsController],
    providers: [
        ApprovalsService,
        GetPendingApprovalsUseCase,
        ReviewExpenseUseCase,
    ],
})
export class ApprovalsModule {}
