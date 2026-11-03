import fs from 'node:fs';
import { formatCurrency, formatPercentage, formatMonthLabel } from '../../frontend/src/features/analytics/utils/analyticsFormatters.ts';

interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

export async function runFrontendPresentationTests(): Promise<TestResult[]> {
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
    console.log('SUB-PHASE 10: FRONTEND FINANCIAL PRESENTATION & FORMATTING TESTING');
    console.log('===============================================================');

    // --- 10.1 CURRENCY FORMATTING TESTS ---
    console.log('\n--- 10.1 Currency Formatting ---');
    assert('10.1.1', 'Format null currency returns $0 fallback', formatCurrency(null) === '$0');
    assert('10.1.2', 'Format zero currency returns $0', formatCurrency(0) === '$0');
    assert('10.1.3', 'Format compact millions (e.g. 8668000) formats to $8.7M', formatCurrency(8668000, true) === '$8.7M');
    assert('10.1.4', 'Format compact thousands (e.g. 450000) formats to $450.0k', formatCurrency(450000, true) === '$450.0k');
    assert('10.1.5', 'Format negative currency preserves negative sign in compact mode (-$558.2k)', formatCurrency(-558209, true) === '-$558.2k');
    assert('10.1.6', 'Format negative currency in full mode displays -$558,209', formatCurrency(-558209) === '-$558,209');

    // --- 10.2 PERCENTAGE FORMATTING TESTS ---
    console.log('\n--- 10.2 Percentage Formatting ---');
    assert('10.2.1', 'Format null percentage returns N/A fallback', formatPercentage(null) === 'N/A');
    assert('10.2.2', 'Format zero percentage returns 0.0%', formatPercentage(0) === '0.0%');
    assert('10.2.3', 'Format fractional percentage (e.g. 75.45) rounds to 1 decimal place (75.5%)', formatPercentage(75.45) === '75.5%');
    assert('10.2.4', 'Format overrun percentage (e.g. 150.25) formats to 150.3%', formatPercentage(150.25) === '150.3%');

    // --- 10.3 DATE / MONTH LABEL FORMATTING ---
    console.log('\n--- 10.3 Month Label Formatting ---');
    assert('10.3.1', 'Format 2025-01 correctly labels Jan 2025 in UTC', formatMonthLabel('2025-01') === 'Jan 2025');
    assert('10.3.2', 'Format 2024-02 (leap year) correctly labels Feb 2024 in UTC', formatMonthLabel('2024-02') === 'Feb 2024');
    assert('10.3.3', 'Format 2025-12 correctly labels Dec 2025 in UTC', formatMonthLabel('2025-12') === 'Dec 2025');
    assert('10.3.4', 'Format empty string gracefully returns empty string fallback', formatMonthLabel('') === '');

    // --- 10.4 TANSTACK QUERY INVALIDATION CACHE KEYS IN HOOKS ---
    console.log('\n--- 10.4 TanStack Query Invalidation Cache Keys ---');
    const approvalsHookSrc = fs.readFileSync('frontend/src/features/approvals/hooks/useApprovals.ts', 'utf8');
    const expensesHookSrc = fs.readFileSync('frontend/src/features/expenses/hooks/useExpenses.ts', 'utf8');
    const budgetsHookSrc = fs.readFileSync('frontend/src/features/budgets/hooks/useBudgets.ts', 'utf8');

    assert('10.4.1', 'Approvals query keys defined with root ["approvals"]', approvalsHookSrc.includes("all: ['approvals']"));
    assert('10.4.2', 'Expenses query keys defined with root ["expenses"]', expensesHookSrc.includes("all: ['expenses']"));
    assert('10.4.3', 'Budgets query keys defined with root ["budgets"]', budgetsHookSrc.includes("all: ['budgets']"));
    assert('10.4.4', 'useReviewExpense invalidates approvals, expenses, and budgets query caches on success', 
        approvalsHookSrc.includes("queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEYS.all })") &&
        approvalsHookSrc.includes("queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEYS.all })") &&
        approvalsHookSrc.includes("queryClient.invalidateQueries({ queryKey: ['budgets'] })")
    );

    return results;
}

runFrontendPresentationTests()
    .then(results => {
        const failed = results.filter(r => !r.passed);
        console.log(`\nSUB-PHASE 10 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
        if (failed.length > 0) process.exit(1);
    })
    .catch(err => {
        console.error('Fatal in Sub-Phase 10:', err);
        process.exit(1);
    });
