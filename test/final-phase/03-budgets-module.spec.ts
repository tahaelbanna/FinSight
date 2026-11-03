import { Pool } from 'pg';
import { createPool, TEST_DB_CONFIG, DEV_DB_CONFIG, assertIsolatedDatabase, cleanTestDb, seedIsolatedFixture } from './test-db.helper';

interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

export async function runBudgetsModuleTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const testPool = createPool(TEST_DB_CONFIG);
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
    console.log('SUB-PHASE 3: BUDGETS MODULE & MODEL B RULES TESTING');
    console.log('===============================================================');

    try {
        await assertIsolatedDatabase(testPool, ['finsight_test_db']);
        await cleanTestDb(testPool);
        const fixture = await seedIsolatedFixture(testPool);

        // --- 3.1 BUDGET CREATION, CONSTRAINTS & MUTATIONS ---
        console.log('\n--- 3.1 Budget Creation, Constraints & Updates (Isolated DB) ---');

        // Test 3.1.1: OpEx budget allocated amount > 0
        const opexBudget = await testPool.query(`SELECT * FROM budgets WHERE budget_id = ${fixture.opexBudgetId};`);
        assert('3.1.1', 'OpEx budget exists with positive allocated amount ($100,000) and department_id set', 
            opexBudget.rows.length === 1 && Number(opexBudget.rows[0].allocated_amount) === 100000 && opexBudget.rows[0].project_id === null
        );

        // Test 3.1.2: CapEx budget allocated amount > 0
        const capexBudget = await testPool.query(`SELECT * FROM budgets WHERE budget_id = ${fixture.capexBudgetId};`);
        assert('3.1.2', 'CapEx budget exists with positive allocated amount ($50,000) and project_id set', 
            capexBudget.rows.length === 1 && Number(capexBudget.rows[0].allocated_amount) === 50000 && capexBudget.rows[0].department_id === null
        );

        // Test 3.1.3: Update budget amount
        await testPool.query(`
            UPDATE budgets SET allocated_amount = 125000.00 WHERE budget_id = ${fixture.opexBudgetId};
        `);
        const updatedOpex = await testPool.query(`SELECT allocated_amount FROM budgets WHERE budget_id = ${fixture.opexBudgetId};`);
        assert('3.1.3', 'Budget update successfully modifies allocated_amount to $125,000.00', Number(updatedOpex.rows[0].allocated_amount) === 125000);

        // Test 3.1.4: Update with zero or negative amount rejected
        let updateZeroFailed = false;
        try {
            await testPool.query(`UPDATE budgets SET allocated_amount = 0 WHERE budget_id = ${fixture.opexBudgetId};`);
        } catch (e: any) {
            updateZeroFailed = true;
        }
        assert('3.1.4', 'DB check constraint blocks updating budget allocated_amount to 0', updateZeroFailed);

        // --- 3.2 MODEL B DUAL-STREAM ACCOUNTING INVARIANTS ---
        console.log('\n--- 3.2 Model B Dual-Stream Accounting Invariants (Isolated DB) ---');

        // Create 2 projects under the department:
        // Project A (Surplus): Budget $50,000, Spend $20,000 -> Surplus +$30,000
        // Project B (Overrun): Budget $30,000, Spend $45,000 -> Overrun -$15,000
        const projBRes = await testPool.query(`
            INSERT INTO projects (project_name, department_id, status, start_date, end_date)
            VALUES ('Analytics Engine', ${fixture.departmentId}, 'active', '2025-01-01', '2025-12-31')
            RETURNING project_id;
        `);
        const projectBId = projBRes.rows[0].project_id;

        await testPool.query(`
            INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
            VALUES (NULL, ${projectBId}, 30000.00, '2025-01-01', '2025-12-31', ${fixture.financeOfficerId});
        `);

        // Insert expenses:
        // OpEx expense: $15,000 approved
        await testPool.query(`
            INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status, reviewer_id, reviewed_at)
            VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 15000.00, 'OpEx SaaS', '2025-03-01', 'approved', ${fixture.managerId}, NOW());
        `);
        // Project A CapEx expense: $20,000 approved
        await testPool.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, reviewed_at)
            VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.projectId}, ${fixture.categoryId}, 20000.00, 'Proj A Infra', '2025-04-01', 'approved', ${fixture.managerId}, NOW());
        `);
        // Project B CapEx expense: $45,000 approved (causing overrun)
        await testPool.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, reviewed_at)
            VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${projectBId}, ${fixture.categoryId}, 45000.00, 'Proj B Compute', '2025-04-15', 'approved', ${fixture.managerId}, NOW());
        `);

        // Invariant 1: Project B Overrun is strictly isolated (-$15,000 deficit)
        const projBMetrics = await testPool.query(`
            SELECT 
                b.allocated_amount as budget,
                COALESCE(SUM(e.amount), 0) as spent,
                b.allocated_amount - COALESCE(SUM(e.amount), 0) as balance,
                ROUND((COALESCE(SUM(e.amount), 0) / b.allocated_amount) * 100, 2) as util
            FROM budgets b
            LEFT JOIN expenses e ON e.project_id = b.project_id AND e.status = 'approved'
            WHERE b.project_id = ${projectBId}
            GROUP BY b.allocated_amount;
        `);
        const pB = projBMetrics.rows[0];
        assert('3.2.1', 'Project B CapEx overrun isolated to exact -$15,000 deficit (150% util)', 
            Number(pB.budget) === 30000 && Number(pB.spent) === 45000 && Number(pB.balance) === -15000 && Number(pB.util) === 150
        );

        // Invariant 2: Project A Surplus is strictly isolated (+$30,000 surplus)
        const projAMetrics = await testPool.query(`
            SELECT 
                b.allocated_amount as budget,
                COALESCE(SUM(e.amount), 0) as spent,
                b.allocated_amount - COALESCE(SUM(e.amount), 0) as balance,
                ROUND((COALESCE(SUM(e.amount), 0) / b.allocated_amount) * 100, 2) as util
            FROM budgets b
            LEFT JOIN expenses e ON e.project_id = b.project_id AND e.status = 'approved'
            WHERE b.project_id = ${fixture.projectId}
            GROUP BY b.allocated_amount;
        `);
        const pA = projAMetrics.rows[0];
        assert('3.2.2', 'Project A CapEx surplus preserved independently at +$30,000 without offsetting Project B overrun', 
            Number(pA.budget) === 50000 && Number(pA.spent) === 20000 && Number(pA.balance) === 30000 && Number(pA.util) === 40
        );

        // Invariant 3: Consolidated Department Metrics (OpEx + CapEx)
        // Consolidated Budget = $125,000 (OpEx) + $50,000 (Proj A) + $30,000 (Proj B) = $205,000
        // Consolidated Spend = $15,000 (OpEx) + $20,000 (Proj A) + $45,000 (Proj B) = $80,000
        const deptConsolidated = await testPool.query(`
            SELECT 
                (SELECT SUM(allocated_amount) FROM budgets WHERE department_id = ${fixture.departmentId}) as opex_budget,
                (SELECT SUM(b.allocated_amount) FROM budgets b JOIN projects p ON b.project_id = p.project_id WHERE p.department_id = ${fixture.departmentId}) as capex_budget,
                (SELECT SUM(amount) FROM expenses WHERE department_id = ${fixture.departmentId} AND status = 'approved' AND project_id IS NULL) as opex_spend,
                (SELECT SUM(amount) FROM expenses WHERE department_id = ${fixture.departmentId} AND status = 'approved' AND project_id IS NOT NULL) as capex_spend;
        `);
        const dc = deptConsolidated.rows[0];
        const totalDeptBudget = Number(dc.opex_budget) + Number(dc.capex_budget);
        const totalDeptSpend = Number(dc.opex_spend) + Number(dc.capex_spend);
        assert('3.2.3', 'Department Consolidated Budget equals OpEx ($125k) + CapEx ($80k) = $205,000.00', totalDeptBudget === 205000);
        assert('3.2.4', 'Department Consolidated Spend equals OpEx ($15k) + CapEx ($65k) = $80,000.00', totalDeptSpend === 80000);

        // Clean up test DB
        await cleanTestDb(testPool);

        // --- 3.3 PRODUCTION BUDGET MODEL AUDIT (DEV DB) ---
        console.log('\n--- 3.3 Production Model B Dual-Stream Verification (DEV DB) ---');
        
        // Sum of OpEx budgets + sum of CapEx budgets = $8,668,000
        const devBgtRes = await devPool.query(`
            SELECT 
                SUM(CASE WHEN department_id IS NOT NULL THEN allocated_amount ELSE 0 END) as opex_total,
                SUM(CASE WHEN project_id IS NOT NULL THEN allocated_amount ELSE 0 END) as capex_total,
                SUM(allocated_amount) as total_budget
            FROM budgets;
        `);
        const b = devBgtRes.rows[0];
        assert('3.3.1', 'Dev DB OpEx Budgets total strictly equals $5,940,000.00', Number(b.opex_total) === 5940000);
        assert('3.3.2', 'Dev DB CapEx Budgets total strictly equals $2,728,000.00', Number(b.capex_total) === 2728000);
        assert('3.3.3', 'Total Enterprise Authorized Budget equals $8,668,000.00 ($5.94M OpEx + $2.728M CapEx)', Number(b.total_budget) === 8668000);

    } finally {
        await testPool.end();
        await devPool.end();
    }

    return results;
}

if (require.main === module) {
    runBudgetsModuleTests()
        .then(results => {
            const failed = results.filter(r => !r.passed);
            console.log(`\nSUB-PHASE 3 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
            if (failed.length > 0) process.exit(1);
        })
        .catch(err => {
            console.error('Fatal in Sub-Phase 3:', err);
            process.exit(1);
        });
}

