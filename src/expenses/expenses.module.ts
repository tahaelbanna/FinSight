import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';

import { Expense } from './schemas/expense.schema';
import { ExpenseCategory } from './schemas/expense-category.schema';
import { ExpenseAttachment } from './schemas/expense-attachment.schema';

import { ExpenseRepository } from './repositories/expense.repository';
import { ExpenseCategoryRepository } from './repositories/expense-category.repository';
import { ExpenseAttachmentRepository } from './repositories/expense-attachment.repository';

import { GetAllCategoriesUseCase } from './usecases/get-all-categories.usecase';
import { SubmitExpenseUseCase } from './usecases/submit-expense.usecase';
import { GetAllExpensesUseCase } from './usecases/get-all-expenses.usecase';
import { GetExpenseByIdUseCase } from './usecases/get-expense-by-id.usecase';
import { DownloadAttachmentUseCase } from './usecases/download-attachment.usecase';

import { FilesUploadModule } from 'src/files-upload/files-upload.module';
import { UsersModule } from 'src/users/users.module';
import { DepartmentsModule } from 'src/departments/departments.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { ExpenseMetricsQuery } from './queries/expense-metrics.query';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Expense, ExpenseCategory, ExpenseAttachment]),
        FilesUploadModule,
        UsersModule,
        DepartmentsModule,
        ProjectsModule,
        ActivityLogsModule
    ],
    providers: [
        ExpensesService,
        ExpenseRepository,
        ExpenseCategoryRepository,
        ExpenseAttachmentRepository,
        GetAllCategoriesUseCase,
        SubmitExpenseUseCase,
        GetAllExpensesUseCase,
        GetExpenseByIdUseCase,
        DownloadAttachmentUseCase,
        ExpenseMetricsQuery
    ],
    controllers: [ExpensesController],
    exports: [ExpensesService, ExpenseRepository, ExpenseMetricsQuery],
})
export class ExpensesModule {}