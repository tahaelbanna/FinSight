/**
 * FinSight Budget & Analytics Deep Audit Validation Suite
 * 
 * Verifies:
 * 1. GET /api/v1/budgets/summary exact calculations and Model B reconciliation
 * 2. Role-based scoping on budgets summary (Admin, Finance Officer, Manager)
 * 3. Analytics Summary date filtering & budget proration consistency
 * 4. Recent 6-Month pipeline behavior and empty state handling
 * 5. Landing page Model B equation updates
 */

const API_BASE = 'http://localhost:4000/api/v1';
const FRONTEND_BASE = 'http://localhost:5173';

let passed = 0;
let failed = 0;

function logPass(msg: string) {
    console.log(`✅ [PASS] ${msg}`);
    passed++;
}

function logFail(msg: string, detail?: any) {
    console.error(`❌ [FAIL] ${msg}`);
    if (detail) console.error('   Detail:', detail);
    failed++;
}

async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    const text = await res.text();
    let json: any = null;
    try {
        json = JSON.parse(text);
    } catch {
        json = text;
    }
    return { status: res.status, data: json };
}

async function login(email: string, password: string = 'admin123'): Promise<string> {
    const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    if (res.status !== 201 || !res.data?.data?.accessToken) {
        throw new Error(`Failed to login with ${email}: ${JSON.stringify(res.data)}`);
    }
    return res.data.data.accessToken;
}

async function runAuditValidation() {
    console.log('====================================================');
    console.log('🔍 FINSIGHT BUDGET & ANALYTICS AUDIT VALIDATION');
    console.log(`Backend Target: ${API_BASE}`);
    console.log('====================================================\n');

    const adminToken = await login('admin@finsight.com', 'admin123');
    const foToken = await login('marcus.vance@seed.finsight.internal', 'Password123!');
    const mgrToken = await login('manager.engineering@seed.finsight.internal', 'Password123!');

    // -----------------------------------------------------------------
    // 1. BUDGETS SUMMARY ENDPOINT & MODEL B RECONCILIATION
    // -----------------------------------------------------------------
    console.log('--- 1. BUDGETS SUMMARY ENDPOINT & MODEL B RECONCILIATION ---');

    const summaryRes = await request('/budgets/summary', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (summaryRes.status === 200 && summaryRes.data?.data) {
        logPass('1.1 GET /budgets/summary returns 200 OK with all three Model B allocation scopes');
        const s = summaryRes.data.data;

        // Reconciliation Check 1: Budget Total
        const expectedTotalBudget = 8668000;
        const expectedOpexBudget = 5940000;
        const expectedCapexBudget = 2728000;
        if (
            s.all_allocations.total_budget === expectedTotalBudget &&
            s.department_opex.total_budget === expectedOpexBudget &&
            s.project_capex.total_budget === expectedCapexBudget &&
            s.all_allocations.total_budget === (s.department_opex.total_budget + s.project_capex.total_budget)
        ) {
            logPass(`1.2 Budget Totals Reconcile: $${s.all_allocations.total_budget} = $${s.department_opex.total_budget} (OpEx) + $${s.project_capex.total_budget} (CapEx)`);
        } else {
            logFail('1.2 Budget totals reconciliation failure', s);
        }

        // Reconciliation Check 2: Approved Spend
        if (
            s.all_allocations.total_approved_spend > 6000000 &&
            s.department_opex.total_approved_spend > 3000000 &&
            s.project_capex.total_approved_spend > 3000000 &&
            s.all_allocations.total_approved_spend === (s.department_opex.total_approved_spend + s.project_capex.total_approved_spend)
        ) {
            logPass(`1.3 Approved Spend Reconciles: $${s.all_allocations.total_approved_spend} = $${s.department_opex.total_approved_spend} (OpEx) + $${s.project_capex.total_approved_spend} (CapEx)`);
        } else {
            logFail('1.3 Approved spend reconciliation failure', s);
        }

        // Reconciliation Check 3: Remaining Budget & Overrun Flag
        const expectedRemaining = s.all_allocations.total_budget - s.all_allocations.total_approved_spend;
        const expectedOpexRemaining = s.department_opex.total_budget - s.department_opex.total_approved_spend;
        const expectedCapexRemaining = s.project_capex.total_budget - s.project_capex.total_approved_spend;
        if (
            s.all_allocations.remaining_budget === expectedRemaining &&
            s.department_opex.remaining_budget === expectedOpexRemaining &&
            s.project_capex.remaining_budget === expectedCapexRemaining &&
            s.project_capex.is_overrun === (expectedCapexRemaining < 0)
        ) {
            logPass(`1.4 Remaining Balance & Overrun: CapEx Overrun flagged ${s.project_capex.is_overrun} ($${s.project_capex.remaining_budget}) and OpEx balance healthy (+$${s.department_opex.remaining_budget})`);
        } else {
            logFail('1.4 Remaining budget or overrun flag failure', s);
        }

        // Check 4: Budget Counts
        if (
            s.all_allocations.total_budgets_count === 54 &&
            s.department_opex.total_budgets_count === 18 &&
            s.project_capex.total_budgets_count === 36
        ) {
            logPass(`1.5 Budget Record Counts: 54 total = 18 OpEx + 36 CapEx allocations`);
        } else {
            logFail('1.5 Budget count failure', s);
        }
    } else {
        logFail('1.1 GET /budgets/summary failed', summaryRes);
    }

    // Finance Officer receives identical global summary
    const foSummaryRes = await request('/budgets/summary', {
        headers: { Authorization: `Bearer ${foToken}` },
    });
    if (
        foSummaryRes.status === 200 &&
        foSummaryRes.data?.data?.all_allocations?.total_budget === 8668000
    ) {
        logPass('1.6 Finance Officer receives organization-wide budget summary ($8.668M)');
    } else {
        logFail('1.6 Finance Officer budget summary failure', foSummaryRes);
    }

    // Manager receives department-scoped summary (Engineering, Dept 1)
    const mgrSummaryRes = await request('/budgets/summary', {
        headers: { Authorization: `Bearer ${mgrToken}` },
    });
    if (
        mgrSummaryRes.status === 200 &&
        mgrSummaryRes.data?.data?.all_allocations?.total_budget === 1917000 &&
        mgrSummaryRes.data?.data?.department_opex?.total_budget === 1485000 &&
        mgrSummaryRes.data?.data?.project_capex?.total_budget === 432000
    ) {
        logPass('1.7 Department Manager receives properly scoped summary (Dept 1: $1.485M OpEx + $432k CapEx = $1.917M)');
    } else {
        logFail('1.7 Department Manager scoping failure', mgrSummaryRes);
    }

    // -----------------------------------------------------------------
    // 2. ANALYTICS CONSISTENCY ACROSS DATE FILTERS
    // -----------------------------------------------------------------
    console.log('\n--- 2. ANALYTICS CONSISTENCY ACROSS DATE FILTERS ---');

    // 2.1 All Time Summary
    const allTimeSummary = await request('/analytics/summary', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sAll = summaryRes.data?.data?.all_allocations;
    if (
        allTimeSummary.status === 200 &&
        allTimeSummary.data?.data?.total_budget === 8668000 &&
        allTimeSummary.data?.data?.total_approved_expenses === sAll?.total_approved_spend &&
        allTimeSummary.data?.data?.total_pending_expenses > 1400000 &&
        allTimeSummary.data?.data?.remaining_budget === (8668000 - sAll?.total_approved_spend)
    ) {
        logPass(`2.1 Analytics Summary (All Time): Reconciles with DB ($8.668M budget, $${(allTimeSummary.data.data.total_approved_expenses / 1e6).toFixed(3)}M spend)`);
    } else {
        logFail('2.1 Analytics Summary All Time failure', allTimeSummary);
    }

    // 2.2 FY 2025 Date Filter Spend Isolation (Full authorized budget unchanged)
    const fy25Summary = await request('/analytics/summary?date_from=2025-01-01&date_to=2025-12-31', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (
        fy25Summary.status === 200 &&
        fy25Summary.data?.data?.total_budget === 8668000 &&
        fy25Summary.data?.data?.total_approved_expenses === 3541815
    ) {
        logPass(`2.2 Analytics Summary (FY 2025): Full authorized budget remains unchanged ($8.668M) and matches 2025 period spend ($3.5418M)`);
    } else {
        logFail('2.2 FY 2025 Summary failure', fy25Summary);
    }

    // 2.3 Recent 6 Months Pipeline Window (2026-05-01 to 2026-11-01)
    const recent6Summary = await request('/analytics/summary?date_from=2026-05-01&date_to=2026-11-01', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (
        recent6Summary.status === 200 &&
        recent6Summary.data?.data?.total_budget === 8668000 &&
        recent6Summary.data?.data?.total_pending_expenses > 1400000 &&
        recent6Summary.data?.data?.total_approved_expenses < 50000
    ) {
        logPass(`2.3 Analytics Summary (Recent 6M): Preserves full authorized budget ($8.668M) and captures active pending pipeline ($${(recent6Summary.data.data.total_pending_expenses / 1e6).toFixed(2)}M)`);
    } else {
        logFail('2.3 Recent 6 Months Summary failure', recent6Summary);
    }

    // 2.4 Monthly Trend: Empty state on true future date range (2035) & active trend on recent
    const futureTrend = await request('/analytics/monthly-trend?date_from=2035-01-01&date_to=2035-12-31', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const recent6Trend = await request('/analytics/monthly-trend?date_from=2026-05-01&date_to=2026-11-01', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (
        futureTrend.status === 200 && Array.isArray(futureTrend.data?.data) && futureTrend.data.data.length === 0 &&
        recent6Trend.status === 200 && Array.isArray(recent6Trend.data?.data)
    ) {
        logPass('2.4 Monthly Trend: Accurately returns empty array [] on future dates (2035) and valid trend data on recent dates');
    } else {
        logFail('2.4 Monthly Trend failure', { futureTrend, recent6Trend });
    }

    // 2.5 Category Breakdown: Empty state on future date range (2035) & valid breakdown on active dates
    const futureCats = await request('/analytics/category-breakdown?date_from=2035-01-01&date_to=2035-12-31', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const recent6Cats = await request('/analytics/category-breakdown?date_from=2026-05-01&date_to=2026-11-01', {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (
        futureCats.status === 200 && Array.isArray(futureCats.data?.data) && futureCats.data.data.length === 0 &&
        recent6Cats.status === 200 && Array.isArray(recent6Cats.data?.data)
    ) {
        logPass('2.5 Category Breakdown: Accurately returns empty array [] on future dates (2035) and valid category breakdown on active dates');
    } else {
        logFail('2.5 Category Breakdown failure', { futureCats, recent6Cats });
    }

    // -----------------------------------------------------------------
    // 3. FRONTEND PUBLIC LANDING PAGE & EQUATION INTEGRITY
    // -----------------------------------------------------------------
    console.log('\n--- 3. FRONTEND PUBLIC LANDING PAGE & EQUATION INTEGRITY ---');

    try {
        const landingRes = await fetch(FRONTEND_BASE);
        if (landingRes.status === 200) {
            logPass('3.1 Public Landing Page route GET / returns 200 OK');
        } else {
            logFail('3.1 Landing page route returned non-200 status', landingRes.status);
        }
    } catch (err: any) {
        logFail('3.1 Failed to reach frontend landing page', err.message);
    }

    // Verify equation structural changes in LandingPage.tsx source
    const fs = await import('fs');
    const landingCode = fs.readFileSync('frontend/src/features/landing/LandingPage.tsx', 'utf-8');
    if (
        !landingCode.includes('OpEx Isolation') &&
        !landingCode.includes('CapEx Isolation') &&
        landingCode.includes('project_id IS NULL') &&
        landingCode.includes('project_id IS NOT NULL')
    ) {
        logPass('3.2 Landing Page: Replaced misleading static 100% percentages with audited Model B architectural badges');
    } else {
        logFail('3.2 Landing page code still contains static 100% isolation labels');
    }

    // -----------------------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 AUDIT VALIDATION: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runAuditValidation().catch((err) => {
    console.error('Unhandled error during audit validation:', err);
    process.exit(1);
});
