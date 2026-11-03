import { Pool } from 'pg';
import { createPool, TEST_DB_CONFIG, assertIsolatedDatabase, cleanTestDb, seedIsolatedFixture } from './test-db.helper';

interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

export async function runConcurrencySafetyTests(): Promise<TestResult[]> {
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
    console.log('SUB-PHASE 7: CONCURRENCY & TRANSACTION SAFETY TESTING (ISOLATED DB)');
    console.log('===============================================================');

    try {
        await assertIsolatedDatabase(testPool, ['finsight_test_db']);
        await cleanTestDb(testPool);
        const fixture = await seedIsolatedFixture(testPool);

        // --- 7.1 CONCURRENT EXPENSE REVIEW RACE CONDITION ---
        console.log('\n--- 7.1 Race Condition: Simultaneous Review Attempts on Same Expense ---');
        
        // Insert 1 pending expense
        const expRes = await testPool.query(`
            INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
            VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 1500.00, 'Race condition test claim', '2025-06-01', 'pending')
            RETURNING expense_id;
        `);
        const targetExpenseId = expRes.rows[0].expense_id;

        // Simulate 5 simultaneous manager review attempts on the exact same pending expense
        const reviewAttempts = Array.from({ length: 5 }, async (_, idx) => {
            const client = await testPool.connect();
            try {
                await client.query('BEGIN;');
                // Optimistic check and update
                const updateRes = await client.query(`
                    UPDATE expenses
                    SET status = 'approved', reviewer_id = ${fixture.managerId}, reviewed_at = NOW()
                    WHERE expense_id = ${targetExpenseId} AND status = 'pending';
                `);

                if (updateRes.rowCount === 1) {
                    await client.query(`
                        INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id)
                        VALUES (${fixture.managerId}, 'EXPENSE_APPROVED', 'expense', ${targetExpenseId});
                    `);
                    await client.query('COMMIT;');
                    return { success: true, worker: idx };
                } else {
                    await client.query('ROLLBACK;');
                    return { success: false, worker: idx, reason: 'Already reviewed' };
                }
            } catch (err: any) {
                await client.query('ROLLBACK;');
                return { success: false, worker: idx, error: err.message };
            } finally {
                client.release();
            }
        });

        const reviewResults = await Promise.all(reviewAttempts);
        const successCount = reviewResults.filter(r => r.success).length;
        const rejectedCount = reviewResults.filter(r => !r.success).length;

        assert('7.1.1', `Optimistic locking: Exactly 1 concurrent review succeeded (successes: ${successCount})`, successCount === 1);
        assert('7.1.2', `Remaining 4 concurrent review attempts were safely rejected (failures: ${rejectedCount})`, rejectedCount === 4);

        // Verify database audit log has exactly 1 approval record
        const logRes = await testPool.query(`
            SELECT COUNT(*) FROM activity_logs WHERE entity_id = ${targetExpenseId} AND action_type = 'EXPENSE_APPROVED';
        `);
        assert('7.1.3', 'Audit log contains exactly 1 EXPENSE_APPROVED record (zero duplicates)', Number(logRes.rows[0].count) === 1);

        // --- 7.2 CONCURRENT HIGH-VOLUME WRITES ---
        console.log('\n--- 7.2 Concurrent Expense Submissions ---');
        const numConcurrentWriters = 20;
        const creationPromises = Array.from({ length: numConcurrentWriters }, async (_, idx) => {
            const amount = 100 + idx * 10;
            const res = await testPool.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, ${amount}, 'Concurrent item #${idx}', '2025-06-02', 'pending')
                RETURNING expense_id, amount;
            `);
            return Number(res.rows[0].amount);
        });

        const createdAmounts = await Promise.all(creationPromises);
        const expectedSum = createdAmounts.reduce((a, b) => a + b, 0);

        const dbAggRes = await testPool.query(`
            SELECT COUNT(*), SUM(amount) FROM expenses WHERE description LIKE 'Concurrent item #%';
        `);
        assert('7.2.1', `All ${numConcurrentWriters} concurrent submissions completed successfully without collision`, 
            Number(dbAggRes.rows[0].count) === numConcurrentWriters
        );
        assert('7.2.2', `Aggregate sum of concurrent submissions ($${dbAggRes.rows[0].sum}) strictly equals expected sum ($${expectedSum})`, 
            Number(dbAggRes.rows[0].sum) === expectedSum
        );

        // --- 7.3 CONCURRENT READS DURING WRITE ACTIVITY ---
        console.log('\n--- 7.3 Concurrent Read Consistency During Active Transaction ---');
        const client1 = await testPool.connect();
        let readDuringWriteConsistent = false;

        try {
            await client1.query('BEGIN;');
            // Insert in uncommitted transaction
            await client1.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 8888.00, 'Uncommitted in-flight', '2025-06-03', 'pending');
            `);

            // Read from client2 (default READ COMMITTED)
            const readRes = await testPool.query(`SELECT COUNT(*) FROM expenses WHERE amount = 8888.00;`);
            // Uncommitted row must NOT be visible to other transactions (no dirty read)
            readDuringWriteConsistent = Number(readRes.rows[0].count) === 0;

            await client1.query('COMMIT;');
        } finally {
            client1.release();
        }

        assert('7.3.1', 'Read committed isolation prevents dirty reads of uncommitted in-flight mutations', readDuringWriteConsistent);

        // Clean up test DB
        await cleanTestDb(testPool);

    } finally {
        await testPool.end();
    }

    return results;
}

if (require.main === module) {
    runConcurrencySafetyTests()
        .then(results => {
            const failed = results.filter(r => !r.passed);
            console.log(`\nSUB-PHASE 7 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
            if (failed.length > 0) process.exit(1);
        })
        .catch(err => {
            console.error('Fatal in Sub-Phase 7:', err);
            process.exit(1);
        });
}

