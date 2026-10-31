import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core.module';
import { SeederService } from './seeder.service';
import { SystemAdmin } from '../../system-admin/schemas/system-admin.schema';
import { User } from '../../users/schemas/users.schema';
import { Department } from '../../departments/schemas/departments.schema';
import { Project } from '../../projects/schemas/project.schema';
import { Budget } from '../../budgets/schemas/budget.schema';
import { Expense } from '../../expenses/schemas/expense.schema';
import { ExpenseCategory } from '../../expenses/schemas/expense-category.schema';
import { ExpenseAttachment } from '../../expenses/schemas/expense-attachment.schema';
import { Notification } from '../../notifications/schemas/notification.schema';
import { ActivityLog } from '../../activity-logs/schemas/activity-log.schema';
import { RefreshToken } from '../../auth/schemas/refresh-token.schema';

@Module({
    imports: [
        CoreModule,
        TypeOrmModule.forFeature([
            SystemAdmin,
            User,
            Department,
            Project,
            Budget,
            Expense,
            ExpenseCategory,
            ExpenseAttachment,
            Notification,
            ActivityLog,
            RefreshToken,
        ]),
    ],
    providers: [SeederService],
    exports: [SeederService],
})
export class SeederModule {}
