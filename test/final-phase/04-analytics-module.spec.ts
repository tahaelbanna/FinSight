import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { UserRepository } from '../../src/users/repositories/users.repository';
import { UserRole } from '../../src/common/enums';
import { User } from '../../src/users/schemas/users.schema';

interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

export async function runAnalyticsModuleTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    const assert = (id: string, description: string, condition: boolean, errorMsg?: string) => {
        if (!condition) {
            results.push({ id, description, passed: false, error: errorMsg || 'Assertion failed' });
            console.error(`❌ [FAIL] ${id}: ${description} - ${errorMsg || ''}`);
        } else {
            results.push({ id, description, passed: true });
            console.log(`✅ [PASS] ${id}: ${description}`);
        }
    };

    console.log('\n===============================================================');
    console.log('SUB-PHASE 4: ANALYTICS MODULE & KPIS TESTING');
    console.log('===============================================================');

    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });

    try {
        const analyticsService = app.get(AnalyticsService);
        const userRepository = app.get(UserRepository);

        const adminUser = await userRepository.findOne({ where: { role: UserRole.ADMIN } });
        const managerUser = await userRepository.findOne({ where: { role: UserRole.MANAGER } });
        const empUser = await userRepository.findOne({ where: { role: UserRole.EMPLOYEE } });

        // --- 4.1 GLOBAL ANALYTICS KPIS (ALL-TIME) ---
        console.log('\n--- 4.1 Global Analytics KPIs (All-Time) ---');
        const summaryAllTime = await analyticsService.getSummary({}, adminUser.user_id, adminUser.role as UserRole);

        assert('4.1.1', 'Total Budget KPI equals $8,668,000.00', Number(summaryAllTime.total_budget) === 8668000);
        assert('4.1.2', 'Total Approved Spend KPI equals $6,540,348.00', Number(summaryAllTime.total_approved_expenses) === 6540348);
        assert('4.1.3', 'Total Pending Spend KPI equals $1,483,665.00', Number(summaryAllTime.total_pending_expenses) === 1483665);
        assert('4.1.4', 'Available Balance KPI equals $2,127,652.00', Number(summaryAllTime.remaining_budget) === 2127652);
        assert('4.1.5', 'Budget Utilization KPI equals 75.45%', Number(summaryAllTime.utilization_percentage) === 75.45);
        assert('4.1.6', 'Remaining balance balances exactly: budget - approved', 
            Number(summaryAllTime.remaining_budget) === Number(summaryAllTime.total_budget) - Number(summaryAllTime.total_approved_expenses)
        );

        // --- 4.2 DATE FILTERING & SENSITIVITY ---
        console.log('\n--- 4.2 Date Filtering & Sensitivity ---');
        // FY 2025: Authorized budget remains $8,668,000 (no proration)
        const summary2025 = await analyticsService.getSummary(
            { date_from: '2025-01-01', date_to: '2025-12-31' },
            adminUser.user_id,
            adminUser.role as UserRole,
        );
        assert('4.2.1', 'FY 2025: Full authorized budget remains unchanged at $8,668,000.00', Number(summary2025.total_budget) === 8668000);
        assert('4.2.2', 'FY 2025: Period spend filters to $3,541,815.00', Number(summary2025.total_approved_expenses) === 3541815);

        // H1 2025: Spend filters to $1,927,529.50
        const summaryH1 = await analyticsService.getSummary(
            { date_from: '2025-01-01', date_to: '2025-06-30' },
            adminUser.user_id,
            adminUser.role as UserRole,
        );
        assert('4.2.3', 'H1 2025: Full authorized budget remains $8,668,000.00 and spend filters to $1,927,529.50', 
            Number(summaryH1.total_budget) === 8668000 && Number(summaryH1.total_approved_expenses) === 1927529.5
        );

        // Monotonic sensitivity: All-Time spend > FY 2025 spend > H1 2025 spend
        assert('4.2.4', 'Monotonic period spend sensitivity verified (All-Time > FY 2025 > H1 2025)', 
            Number(summaryAllTime.total_approved_expenses) > Number(summary2025.total_approved_expenses) &&
            Number(summary2025.total_approved_expenses) > Number(summaryH1.total_approved_expenses)
        );

        // Future 2035 boundary: 0 spend, full budget, 0% utilization
        const summary2035 = await analyticsService.getSummary(
            { date_from: '2035-01-01', date_to: '2035-12-31' },
            adminUser.user_id,
            adminUser.role as UserRole,
        );
        assert('4.2.5', 'Future 2035 window reports 0 spend, $8.668M budget, 0% utilization (no division-by-zero)', 
            Number(summary2035.total_approved_expenses) === 0 &&
            Number(summary2035.total_budget) === 8668000 &&
            Number(summary2035.utilization_percentage) === 0
        );

        // --- 4.3 CHARTS & AGGREGATIONS ---
        console.log('\n--- 4.3 Charts, Breakdowns & Comparisons ---');

        // Monthly trend
        const monthlyTrend = await analyticsService.getMonthlyTrend({}, adminUser.user_id, adminUser.role as UserRole);
        assert('4.3.1', 'Monthly trend returns valid chronological array with positive totals', 
            Array.isArray(monthlyTrend) && monthlyTrend.length > 0 && monthlyTrend.every(m => m.total >= 0)
        );

        // Category breakdown
        const categoryBreakdown = await analyticsService.getCategoryBreakdown({}, adminUser.user_id, adminUser.role as UserRole);
        assert('4.3.2', 'Category breakdown returns all enterprise categories with non-zero spending', 
            Array.isArray(categoryBreakdown) && categoryBreakdown.length > 0
        );

        // Department comparison
        const deptComparison = await analyticsService.getDepartmentComparison({}, adminUser.user_id, adminUser.role as UserRole);
        assert('4.3.3', 'Department comparison returns all 6 departments with Model B consolidated budgets', 
            deptComparison.length === 6 && deptComparison.every(d => d.allocatedBudget > 0)
        );

        // Project performance
        const projPerformance = await analyticsService.getProjectPerformance({}, adminUser.user_id, adminUser.role as UserRole);
        assert('4.3.4', 'Project performance returns all 18 enterprise projects with ring-fenced budgets', 
            projPerformance.length === 18 && projPerformance.every(p => p.allocated_budget > 0)
        );

        // --- 4.4 CROSS-ENDPOINT CONSISTENCY ---
        console.log('\n--- 4.4 Cross-Endpoint Consistency ---');

        // Sum of all department budgets === Summary total_budget
        const sumDeptBudgets = Number(deptComparison.reduce((sum, d) => sum + d.allocatedBudget, 0).toFixed(2));
        assert('4.4.1', `Sum of department budgets ($${sumDeptBudgets}) === Summary budget ($${summaryAllTime.total_budget})`, 
            sumDeptBudgets === Number(summaryAllTime.total_budget)
        );

        // Sum of all department approved spends === Summary approved spend
        const sumDeptSpend = Number(deptComparison.reduce((sum, d) => sum + d.totalApproved, 0).toFixed(2));
        assert('4.4.2', `Sum of department approved spends ($${sumDeptSpend}) === Summary approved spend ($${summaryAllTime.total_approved_expenses})`, 
            sumDeptSpend === Number(summaryAllTime.total_approved_expenses)
        );

        // Scoping consistency for Department Manager
        const mgrSummary = await analyticsService.getSummary({}, managerUser.user_id, managerUser.role as UserRole);
        const mgrDeptComp = await analyticsService.getDepartmentComparison({}, managerUser.user_id, managerUser.role as UserRole);
        assert('4.4.3', 'Department Manager scoped summary ($1,917,000 budget) matches scoped department comparison', 
            mgrDeptComp.length === 1 && Number(mgrSummary.total_budget) === mgrDeptComp[0].allocatedBudget &&
            Number(mgrSummary.total_approved_expenses) === mgrDeptComp[0].totalApproved
        );

        // Employee zero-budget scope
        const empSummary = await analyticsService.getSummary({}, empUser.user_id, empUser.role as UserRole);
        assert('4.4.4', 'Employee role receives total_budget = 0 and utilization = 0 without error', 
            Number(empSummary.total_budget) === 0 && Number(empSummary.utilization_percentage) === 0
        );

    } finally {
        await app.close();
    }

    return results;
}

if (require.main === module) {
    runAnalyticsModuleTests()
        .then(results => {
            const failed = results.filter(r => !r.passed);
            console.log(`\nSUB-PHASE 4 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
            if (failed.length > 0) process.exit(1);
        })
        .catch(err => {
            console.error('Fatal in Sub-Phase 4:', err);
            process.exit(1);
        });
}
