import { CoreModule } from './core.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { AuthModule } from './auth/auth.module';
import { SystemAdminModule } from './system-admin/system-admin.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/guards/role-gaurd.guard';
import { ProjectsModule } from './projects/projects.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FilesUploadModule } from './files-upload/files-upload.module';
import { ApprovalsModule } from './approvals/approvals.module';
@Module({
    imports: [
        CoreModule,
        UsersModule,
        DepartmentsModule,
        AuthModule,
        SystemAdminModule,
        ProjectsModule,
        BudgetsModule,
        ExpensesModule,
        FilesUploadModule,
        ApprovalsModule
    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
