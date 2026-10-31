import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { GetAnalyticsFilterDto } from './dtos/get-analytics-filter.dto';
import { AnalyticsSummaryResponseDto } from './dtos/analytics-summary-response.dto';
import { MonthlyTrendResponseDto } from './dtos/monthly-trend-response.dto';
import { DepartmentComparisonResponseDto } from './dtos/department-comparison-response.dto';
import { CategoryBreakdownResponseDto } from './dtos/category-breakdown-response.dto';
import { ProjectPerformanceResponseDto } from './dtos/project-performance-response.dto';
import {
    CurrentUser,
    Principal,
} from 'src/auth/decorators/current-user.decorator';
import { AllowRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('summary')
    async getSummary(
        @Query() query: GetAnalyticsFilterDto,
        @CurrentUser() principal: Principal,
    ): Promise<AnalyticsSummaryResponseDto> {
        return this.analyticsService.getSummary(query, principal.user.user_id);
    }

    @Get('monthly-trend')
    async getMonthlyTrend(
        @Query() query: GetAnalyticsFilterDto,
        @CurrentUser() principal: Principal,
    ): Promise<MonthlyTrendResponseDto[]> {
        return this.analyticsService.getMonthlyTrend(
            query,
            principal.user.user_id,
        );
    }

    @Get('category-breakdown')
    async getCategoryBreakdown(
        @Query() query: GetAnalyticsFilterDto,
        @CurrentUser() principal: Principal,
    ): Promise<CategoryBreakdownResponseDto[]> {
        return this.analyticsService.getCategoryBreakdown(
            query,
            principal.user.user_id,
        );
    }

    @Get('department-comparison')
    @AllowRoles(UserRole.ADMIN, UserRole.FINANCE_OFFICER, UserRole.MANAGER)
    async getDeptComparison(
        @Query() query: GetAnalyticsFilterDto,
        @CurrentUser() principal: Principal,
    ): Promise<DepartmentComparisonResponseDto[]> {
        return this.analyticsService.getDepartmentComparison(
            query,
            principal.user.user_id,
        );
    }

    @Get('project-performance')
    @AllowRoles(UserRole.ADMIN, UserRole.FINANCE_OFFICER, UserRole.MANAGER)
    async getProjectPerformance(
        @Query() query: GetAnalyticsFilterDto,
        @CurrentUser() principal: Principal,
    ): Promise<ProjectPerformanceResponseDto[]> {
        return this.analyticsService.getProjectPerformance(
            query,
            principal.user.user_id,
        );
    }
}
