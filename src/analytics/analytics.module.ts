import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { GetSummaryUseCase } from './usecases/get-summary.usecase';
import { GetMonthlyTrendUseCase } from './usecases/get-monthly-trend.usecase';
import { GetDepartmentComparisonUseCase } from './usecases/get-department-comparison.usecase';
import { GetCategoryBreakdownUseCase } from './usecases/get-category-breakdown.usecase';
import { GetProjectPerformanceUseCase } from './usecases/get-project-performance.usecase';
import { UsersModule } from 'src/users/users.module';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { BudgetsModule } from 'src/budgets/budgets.module';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
    imports: [UsersModule, ExpensesModule, BudgetsModule, ProjectsModule],
    controllers: [AnalyticsController],
    providers: [
        AnalyticsService,
        GetSummaryUseCase,
        GetMonthlyTrendUseCase,
        GetDepartmentComparisonUseCase,
        GetCategoryBreakdownUseCase,
        GetProjectPerformanceUseCase,
    ],
})
export class AnalyticsModule {}
