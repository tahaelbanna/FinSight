import { Pool } from 'pg';
import { createPool, TEST_DB_CONFIG, assertIsolatedDatabase, cleanTestDb, seedIsolatedFixture } from './test-db.helper';

interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

export async function runWriteOperationsTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const testPool = createPool(TEST_DB_CONFIG);

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
    console.log('SUB-PHASE 6: FINANCIAL WRITE OPERATIONS & STATE TRANSITIONS (ISOLATED DB)');
    console.log('===============================================================');

    try {
        await assertIsolatedDatabase(testPool, ['finsight_test_db']);
        await cleanTestDb(testPool);
        const fixture = await seedIsolatedFixture(testPool);

        // --- STEP 1: INITIAL STATE CAPTURE ---
        console.log('\n--- Step 1: Initial State Capture ---');
        const initialAggRes = await testPool.query(`
            SELECT 
                COUNT(*) as total_expenses,
                COALESCE(SUM(amount), 0) as total_amount
            FROM expenses;
        `);
        assert('6.1', 'Initial state verified: 0 expenses in isolated DB', Number(initialAggRes.rows[0].total_expenses) === 0);

        // --- STEP 2: EXPENSE SUBMISSION (MUTATION 1) ---
        console.log('\n--- Step 2: Expense Submission Mutation ---');
        const submitRes = await testPool.query(`
            INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
            VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 2500.00, 'Cloud Migration Tools', '2025-05-10', 'pending')
            RETURNING expense_id, status, amount;
        `);
        const expId = submitRes.rows[0].expense_id;

        // Activity log insertion
        await testPool.query(`
            INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id)
            VALUES (${fixture.employeeId}, 'EXPENSE_SUBMITTED', 'expense', ${expId});
        `);

        // Check propagation: Pending pool increased by $2500, Approved remains $0
        const postSubmitAgg = await testPool.query(`
            SELECT 
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_total,
                SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_total
            FROM expenses;
        `);
        assert('6.2.1', 'Expense submission increases Pending pool by $2,500.00', Number(postSubmitAgg.rows[0].pending_total) === 2500);
        assert('6.2.2', 'Expense submission does NOT increase Approved pool ($0.00)', Number(postSubmitAgg.rows[0].approved_total) === 0);

        // Verify activity log generated
        const submitLog = await testPool.query(`
            SELECT action_type FROM activity_logs WHERE entity_id = ${expId};
        `);
        assert('6.2.3', 'Activity log record EXPENSE_SUBMITTED exists for mutation', submitLog.rows[0].action_type === 'EXPENSE_SUBMITTED');

        // --- STEP 3: EXPENSE APPROVAL (MUTATION 2) ---
        console.log('\n--- Step 3: Expense Approval Mutation ---');
        await testPool.query(`
            UPDATE expenses 
            SET status = 'approved', reviewer_id = ${fixture.managerId}, reviewed_at = NOW() 
            WHERE expense_id = ${expId};
            INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id)
            VALUES (${fixture.managerId}, 'EXPENSE_APPROVED', 'expense', ${expId});
        `);

        // Verify state propagation: Pending decreases to $0, Approved increases to $2500
        const postApproveAgg = await testPool.query(`
            SELECT 
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_total,
                SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_total
            FROM expenses;
        `);
        assert('6.3.1', 'Approval decreases Pending pool to $0.00', Number(postApproveAgg.rows[0].pending_total) === 0);
        assert('6.3.2', 'Approval increases Approved pool to $2,500.00', Number(postApproveAgg.rows[0].approved_total) === 2500);

        // Verify remaining budget recalculated
        const postApproveBudget = await testPool.query(`
            SELECT 
                b.allocated_amount - (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'approved' AND department_id = b.department_id AND project_id IS NULL) as remaining
            FROM budgets b 
            WHERE b.budget_id = ${fixture.opexBudgetId};
        `);
        // Allocated $100,000 - $2,500 = $97,500
        assert('6.3.3', 'Remaining OpEx budget automatically reflects deduction ($97,500.00)', Number(postApproveBudget.rows[0].remaining) === 97500);

        // --- STEP 4: FAILED TRANSACTION ROLLBACK ---
        console.log('\n--- Step 4: Transaction Rollback on Failure ---');
        const client = await testPool.connect();
        let rollbackSucceeded = false;
        try {
            await client.query('BEGIN;');
            // 1. Insert valid pending expense
            const failExp = await client.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 7777.00, 'Tentative expense', '2025-05-12', 'pending')
                RETURNING expense_id;
            `);
            const failId = failExp.rows[0].expense_id;

            // 2. Trigger intentional constraint error in the same transaction
            await client.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, -999.00, 'Invalid', '2025-05-12', 'pending');
            `);
            await client.query('COMMIT;');
        } catch (err: any) {
            await client.query('ROLLBACK;');
            rollbackSucceeded = true;
        } finally {
            client.release();
        }

        // Verify complete atomicity: no partial write for $7,777.00
        const checkRollback = await testPool.query(`
            SELECT * FROM expenses WHERE amount = 7777.00;
        `);
        assert('6.4.1', 'Transaction failed cleanly with ROLLBACK: 0 partial records inserted', rollbackSucceeded && checkRollback.rows.length === 0);

        // Verify unrelated records remained 100% intact
        const finalCheck = await testPool.query(`
            SELECT expense_id, amount, status FROM expenses WHERE expense_id = ${expId};
        `);
        assert('6.4.2', 'Original approved expense remained 100% intact with amount $2,500.00 after rolled back transaction', 
            finalCheck.rows.length === 1 && Number(finalCheck.rows[0].amount) === 2500 && finalCheck.rows[0].status === 'approved'
        );

        // Clean up test DB
        await cleanTestDb(testPool);

    } finally {
        await testPool.end();
    }

    return results;
}

if (require.main === module) {
    runWriteOperationsTests()
        .then(results => {
            const failed = results.filter(r => !r.passed);
            console.log(`\nSUB-PHASE 6 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
            if (failed.length > 0) process.exit(1);
        })
        .catch(err => {
            console.error('Fatal in Sub-Phase 6:', err);
            process.exit(1);
        });
}

