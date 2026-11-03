import { runFinancialDataIntegrityTests } from './01-financial-data-integrity.spec';
import { runExpensesModuleTests } from './02-expenses-module.spec';
import { runBudgetsModuleTests } from './03-budgets-module.spec';
import { runAnalyticsModuleTests } from './04-analytics-module.spec';
import { runCrossModuleReconciliationTests } from './05-cross-module-reconciliation.spec';
import { runWriteOperationsTests } from './06-write-operations.spec';
import { runConcurrencySafetyTests } from './07-concurrency-safety.spec';
import { runPerformanceScalabilityTests } from './08-performance-scalability.spec';
import { runSecurityRbacTests } from './09-security-rbac.spec';

interface SuiteSummary {
    suite: string;
    total: number;
    passed: number;
    failed: number;
}

async function runAll() {
    console.log('========================================================================');
    console.log('🚀 FINSIGHT COMPREHENSIVE FINANCIAL SYSTEM TEST SUITE RUNNER');
    console.log('========================================================================\n');

    const summaries: SuiteSummary[] = [];

    const suites = [
        { name: 'Sub-Phase 1: Financial Data Integrity', fn: runFinancialDataIntegrityTests },
        { name: 'Sub-Phase 2: Expenses Module Testing', fn: runExpensesModuleTests },
        { name: 'Sub-Phase 3: Budgets Module & Model B', fn: runBudgetsModuleTests },
        { name: 'Sub-Phase 4: Analytics Module & KPIs', fn: runAnalyticsModuleTests },
        { name: 'Sub-Phase 5: Cross-Module Reconciliation', fn: runCrossModuleReconciliationTests },
        { name: 'Sub-Phase 6: Write Operations & Transitions', fn: runWriteOperationsTests },
        { name: 'Sub-Phase 7: Concurrency & Transaction Safety', fn: runConcurrencySafetyTests },
        { name: 'Sub-Phase 8: Performance & Scalability', fn: runPerformanceScalabilityTests },
        { name: 'Sub-Phase 9: Security & Role-Based Access (RBAC)', fn: runSecurityRbacTests },
    ];

    for (const s of suites) {
        try {
            const results = await s.fn();
            const failed = results.filter(r => !r.passed).length;
            summaries.push({
                suite: s.name,
                total: results.length,
                passed: results.length - failed,
                failed,
            });
        } catch (err: any) {
            console.error(`💥 Fatal error executing ${s.name}:`, err);
            summaries.push({
                suite: s.name,
                total: 0,
                passed: 0,
                failed: 1,
            });
        }
    }

    console.log('\n========================================================================');
    console.log('📊 FINAL COMPREHENSIVE FINANCIAL TEST SUITE SUMMARY');
    console.log('========================================================================');
    console.table(summaries);

    const grandTotal = summaries.reduce((acc, s) => acc + s.total, 0);
    const grandPassed = summaries.reduce((acc, s) => acc + s.passed, 0);
    const grandFailed = summaries.reduce((acc, s) => acc + s.failed, 0);

    console.log(`GRAND TOTAL: ${grandPassed}/${grandTotal} PASSED (Failed: ${grandFailed})`);

    if (grandFailed > 0) {
        process.exit(1);
    }
}

runAll().catch(err => {
    console.error('Fatal in test runner:', err);
    process.exit(1);
});

