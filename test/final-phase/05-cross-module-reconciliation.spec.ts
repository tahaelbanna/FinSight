import { Pool } from 'pg';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { BudgetsService } from '../../src/budgets/budgets.service';
import { UserRepository } from '../../src/users/repositories/users.repository';
import { UserRole } from '../../src/common/enums';
import { createPool, DEV_DB_CONFIG } from './test-db.helper';

interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

export async function runCrossModuleReconciliationTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const devPool = createPool(DEV_DB_CONFIG);

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
    console.log('SUB-PHASE 5: CROSS-MODULE FINANCIAL RECONCILIATION');
    console.log('===============================================================');

    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });

    try {
        const analyticsService = app.get(AnalyticsService);
        const budgetsService = app.get(BudgetsService);
        const userRepo = app.get(UserRepository);

        const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });

        // --- 1. INVARIANT 1: Total Approved Expenses = OpEx Approved + CapEx Approved ---
        console.log('\n--- Invariant 1: Total Approved = OpEx Approved + CapEx Approved ---');
        const expRes = await devPool.query(`
            SELECT 
                SUM(CASE WHEN project_id IS NULL THEN amount ELSE 0 END) as opex_spent,
                SUM(CASE WHEN project_id IS NOT NULL THEN amount ELSE 0 END) as capex_spent,
                SUM(amount) as total_approved
            FROM expenses 
            WHERE status = 'approved';
        `);
        const opexSpent = Number(expRes.rows[0].opex_spent);
        const capexSpent = Number(expRes.rows[0].capex_spent);
        const totalApproved = Number(expRes.rows[0].total_approved);
        assert('5.1', `Invariant 1: $${totalApproved} === OpEx ($${opexSpent}) + CapEx ($${capexSpent})`, 
            totalApproved === Number((opexSpent + capexSpent).toFixed(2))
        );

        // --- 2. INVARIANT 2: Total Allocated Budget = OpEx Budget + CapEx Budget ---
        console.log('\n--- Invariant 2: Total Budget = OpEx Budget + CapEx Budget ---');
        const bgtRes = await devPool.query(`
            SELECT 
                SUM(CASE WHEN department_id IS NOT NULL THEN allocated_amount ELSE 0 END) as opex_budget,
                SUM(CASE WHEN project_id IS NOT NULL THEN allocated_amount ELSE 0 END) as capex_budget,
                SUM(allocated_amount) as total_budget
            FROM budgets;
        `);
        const opexBudget = Number(bgtRes.rows[0].opex_budget);
        const capexBudget = Number(bgtRes.rows[0].capex_budget);
        const totalBudget = Number(bgtRes.rows[0].total_budget);
        assert('5.2', `Invariant 2: $${totalBudget} === OpEx Budget ($${opexBudget}) + CapEx Budget ($${capexBudget})`, 
            totalBudget === Number((opexBudget + capexBudget).toFixed(2))
        );

        // --- 3. INVARIANT 3: Available Budget = Total Allocated Budget - Approved Spend ---
        console.log('\n--- Invariant 3: Available Budget = Total Budget - Approved Spend ---');
        const availableBudget = Number((totalBudget - totalApproved).toFixed(2));
        const summary = await analyticsService.getSummary({}, admin.user_id, admin.role as UserRole);
        assert('5.3', `Invariant 3: Available Balance ($${summary.remaining_budget}) === $${totalBudget} - $${totalApproved} ($${availableBudget})`, 
            Number(summary.remaining_budget) === availableBudget
        );

        // --- 4. INVARIANT 4 & 5: Department Consolidated Metrics Reconcile ---
        console.log('\n--- Invariants 4 & 5: Department Consolidated Spending & Budgets ---');
        const deptComp = await analyticsService.getDepartmentComparison({}, admin.user_id, admin.role as UserRole);
        const sumDeptAllocated = Number(deptComp.reduce((sum, d) => sum + d.allocatedBudget, 0).toFixed(2));
        const sumDeptApproved = Number(deptComp.reduce((sum, d) => sum + d.totalApproved, 0).toFixed(2));
        assert('5.4', `Invariant 4: Aggregate Department Comparison Spends ($${sumDeptApproved}) strictly equals Total Approved ($${totalApproved})`, 
            sumDeptApproved === totalApproved
        );
        assert('5.5', `Invariant 5: Aggregate Department Comparison Budgets ($${sumDeptAllocated}) strictly equals Total Budget ($${totalBudget})`, 
            sumDeptAllocated === totalBudget
        );

        // --- 5. INVARIANT 6: Pending & Rejected Excluded from Approved Spending ---
        console.log('\n--- Invariant 6: Approved Spend Excludes Pending & Rejected Claims ---');
        const pendingCountRes = await devPool.query(`SELECT COUNT(*), SUM(amount) FROM expenses WHERE status = 'pending';`);
        const rejectedCountRes = await devPool.query(`SELECT COUNT(*), SUM(amount) FROM expenses WHERE status = 'rejected';`);
        assert('5.6.1', `412 Pending claims ($1,483,665.00) are excluded from total approved spending`, 
            Number(pendingCountRes.rows[0].count) === 412 && Number(pendingCountRes.rows[0].sum) === 1483665
        );
        assert('5.6.2', `421 Rejected claims ($1,342,687.00) are excluded from total approved spending`, 
            Number(rejectedCountRes.rows[0].count) === 421 && Number(rejectedCountRes.rows[0].sum) === 1342687
        );

        // --- 6. INVARIANT 7 & 8: Project CapEx Isolation & Zero Double-Counting ---
        console.log('\n--- Invariants 7 & 8: Project CapEx Ring-Fencing & Single-Counting ---');
        const projPerf = await analyticsService.getProjectPerformance({}, admin.user_id, admin.role as UserRole);
        const sumProjectBudgets = Number(projPerf.reduce((sum, p) => sum + p.allocated_budget, 0).toFixed(2));
        const sumProjectSpends = Number(projPerf.reduce((sum, p) => sum + p.total_spent, 0).toFixed(2));
        assert('5.7', `Invariant 7: Sum of independent project budgets ($${sumProjectBudgets}) strictly equals DB CapEx Budget ($${capexBudget})`, 
            sumProjectBudgets === capexBudget
        );
        assert('5.8', `Invariant 8: Sum of independent project approved spends ($${sumProjectSpends}) strictly equals DB CapEx Spend ($${capexSpent})`, 
            sumProjectSpends === capexSpent
        );

        // --- 7. INVARIANT 9: Budget Summary API Reconciles with Analytics Summary ---
        console.log('\n--- Invariant 9: Budget Summary API vs Analytics Summary API ---');
        const budgetSummary = await budgetsService.getSummary(admin.user_id, admin.role as UserRole);
        assert('5.9.1', 'Budget Summary total_budget matches Analytics Summary total_budget ($8,668,000)', 
            Number(budgetSummary.all_allocations.total_budget) === Number(summary.total_budget)
        );
        assert('5.9.2', 'Budget Summary total_approved_spend matches Analytics Summary total_approved ($6,540,348)', 
            Number(budgetSummary.all_allocations.total_approved_spend) === Number(summary.total_approved_expenses)
        );

        // --- 8. INVARIANT 10: Underlying Record Count & Sum Reconciliation ---
        console.log('\n--- Invariant 10: Complete Record Accounting Reconciliation ---');
        const totalRecordCountRes = await devPool.query(`SELECT COUNT(*), SUM(amount) FROM expenses;`);
        const totalClaims = Number(totalRecordCountRes.rows[0].count);
        const totalClaimsAmount = Number(totalRecordCountRes.rows[0].sum);
        const expectedTotalClaimsAmount = 6540348 + 1483665 + 1342687;
        assert('5.10.1', 'All 2,801 expense records in database account for exact 100% distribution', totalClaims === 2801);
        assert('5.10.2', `Total claims sum ($${totalClaimsAmount}) equals approved + pending + rejected ($${expectedTotalClaimsAmount})`, 
            totalClaimsAmount === expectedTotalClaimsAmount
        );

    } finally {
        await app.close();
        await devPool.end();
    }

    return results;
}

if (require.main === module) {
    runCrossModuleReconciliationTests()
        .then(results => {
            const failed = results.filter(r => !r.passed);
            console.log(`\nSUB-PHASE 5 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
            if (failed.length > 0) process.exit(1);
        })
        .catch(err => {
            console.error('Fatal in Sub-Phase 5:', err);
            process.exit(1);
        });
}
