import { Injectable } from '@nestjs/common';
import { GetSummaryUseCase } from './usecases/get-summary.usecase';
import { GetMonthlyTrendUseCase } from './usecases/get-monthly-trend.usecase';
import { GetDepartmentComparisonUseCase } from './usecases/get-department-comparison.usecase';
import { GetCategoryBreakdownUseCase } from './usecases/get-category-breakdown.usecase';
import { GetProjectPerformanceUseCase } from './usecases/get-project-performance.usecase';
import { GetAnalyticsFilterDto } from './dtos/get-analytics-filter.dto';
import { AnalyticsSummaryResponseDto } from './dtos/analytics-summary-response.dto';
import { MonthlyTrendResponseDto } from './dtos/monthly-trend-response.dto';
import { DepartmentComparisonResponseDto } from './dtos/department-comparison-response.dto';
import { CategoryBreakdownResponseDto } from './dtos/category-breakdown-response.dto';
import { ProjectPerformanceResponseDto } from './dtos/project-performance-response.dto';

@Injectable()
export class AnalyticsService {
    constructor(
        private readonly getSummaryUseCase: GetSummaryUseCase,
        private readonly getMonthlyTrendUseCase: GetMonthlyTrendUseCase,
        private readonly getDepartmentComparisonUseCase: GetDepartmentComparisonUseCase,
        private readonly getCategoryBreakdownUseCase: GetCategoryBreakdownUseCase,
        private readonly getProjectPerformanceUseCase: GetProjectPerformanceUseCase,
    ) {}

    async getSummary(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<AnalyticsSummaryResponseDto> {
        return this.getSummaryUseCase.execute(query, user_id);
    }

    async getMonthlyTrend(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<MonthlyTrendResponseDto[]> {
        return this.getMonthlyTrendUseCase.execute(query, user_id);
    }

    async getDepartmentComparison(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<DepartmentComparisonResponseDto[]> {
        return this.getDepartmentComparisonUseCase.execute(query, user_id);
    }

    async getCategoryBreakdown(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<CategoryBreakdownResponseDto[]> {
        return this.getCategoryBreakdownUseCase.execute(query, user_id);
    }

    async getProjectPerformance(
        query: GetAnalyticsFilterDto,
        user_id: string,
    ): Promise<ProjectPerformanceResponseDto[]> {
        return this.getProjectPerformanceUseCase.execute(query, user_id);
    }
}
