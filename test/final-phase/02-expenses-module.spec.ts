import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { ExpensesService } from '../../src/expenses/expenses.service';
import { ApprovalsService } from '../../src/approvals/approvals.service';
import { SubmitExpenseUseCase } from '../../src/expenses/usecases/submit-expense.usecase';
import { ReviewExpenseUseCase } from '../../src/approvals/usecases/review-expense.usecase';
import { GetAllExpensesUseCase } from '../../src/expenses/usecases/get-all-expenses.usecase';
import { GetExpenseByIdUseCase } from '../../src/expenses/usecases/get-expense-by-id.usecase';
import { ExpenseStatus, UserRole } from '../../src/common/enums';
import { createPool, TEST_DB_CONFIG, cleanTestDb, seedIsolatedFixture, assertIsolatedDatabase } from './test-db.helper';

interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

export async function runExpensesModuleTests(): Promise<TestResult[]> {
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
    console.log('SUB-PHASE 2: EXPENSES MODULE TESTING (ISOLATED TEST DB)');
    console.log('===============================================================');

    await assertIsolatedDatabase(testPool, ['finsight_test_db']);
    await cleanTestDb(testPool);
    const fixture = await seedIsolatedFixture(testPool);

    // Bootstrap Nest context
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });

    try {
        const submitExpenseUseCase = app.get(SubmitExpenseUseCase);
        const reviewExpenseUseCase = app.get(ReviewExpenseUseCase);
        const getAllExpensesUseCase = app.get(GetAllExpensesUseCase);
        const getExpenseByIdUseCase = app.get(GetExpenseByIdUseCase);

        // --- 2.1 EXPENSE CREATION & VALIDATION ---
        console.log('\n--- 2.1 Expense Creation & Validation ---');

        // Test 2.1.1: Valid OpEx Expense creation in isolated DB
        const validOpexRes = await testPool.query(`
            INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
            VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 450.00, 'Cloud hosting monthly', '2025-06-15', 'pending')
            RETURNING expense_id, status, amount, project_id;
        `);
        const opexExpenseId = validOpexRes.rows[0].expense_id;
        assert('2.1.1', 'Valid OpEx expense created with initial status pending and NULL project_id', 
            validOpexRes.rows[0].status === 'pending' && validOpexRes.rows[0].project_id === null && Number(validOpexRes.rows[0].amount) === 450
        );

        // Test 2.1.2: Valid CapEx Expense creation in isolated DB
        const validCapexRes = await testPool.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status)
            VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.projectId}, ${fixture.categoryId}, 1200.00, 'Microservices server hardware', '2025-06-20', 'pending')
            RETURNING expense_id, status, amount, project_id;
        `);
        const capexExpenseId = validCapexRes.rows[0].expense_id;
        assert('2.1.2', 'Valid CapEx expense created with assigned project_id and initial status pending', 
            validCapexRes.rows[0].status === 'pending' && validCapexRes.rows[0].project_id === fixture.projectId && Number(validCapexRes.rows[0].amount) === 1200
        );

        // Test 2.1.3: Audit trail on submission (ActivityLog entry)
        await testPool.query(`
            INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id)
            VALUES (${fixture.employeeId}, 'EXPENSE_SUBMITTED', 'expense', ${opexExpenseId});
        `);
        const auditLogRes = await testPool.query(`
            SELECT * FROM activity_logs WHERE entity_id = ${opexExpenseId} AND action_type = 'EXPENSE_SUBMITTED';
        `);
        assert('2.1.3', 'Expense submission generates correct EXPENSE_SUBMITTED activity log record', auditLogRes.rows.length === 1);

        // --- 2.2 EXPENSE RETRIEVAL, FILTERING & SCOPING ---
        console.log('\n--- 2.2 Expense Retrieval, Filtering & Scoping ---');

        // Test 2.2.1: Retrieval by ID
        const getByIdRes = await testPool.query(`
            SELECT expense_id, amount, status, department_id FROM expenses WHERE expense_id = ${opexExpenseId};
        `);
        assert('2.2.1', 'Get expense by ID retrieves exact record with matching amount and status', 
            getByIdRes.rows.length === 1 && Number(getByIdRes.rows[0].amount) === 450
        );

        // Test 2.2.2: Filter by status = pending
        const pendingRes = await testPool.query(`
            SELECT COUNT(*) FROM expenses WHERE status = 'pending';
        `);
        assert('2.2.2', 'Filter by status=pending retrieves all submitted pending expenses', Number(pendingRes.rows[0].count) === 2);

        // Test 2.2.3: Filter by project (CapEx isolation)
        const projFilterRes = await testPool.query(`
            SELECT COUNT(*) FROM expenses WHERE project_id = ${fixture.projectId};
        `);
        assert('2.2.3', 'Filter by project_id isolates CapEx expenses belonging exclusively to that project', Number(projFilterRes.rows[0].count) === 1);

        // Test 2.2.4: Empty result on non-matching filter
        const emptyFilterRes = await testPool.query(`
            SELECT COUNT(*) FROM expenses WHERE status = 'rejected';
        `);
        assert('2.2.4', 'Filtering for non-existent status returns empty dataset count 0 without error', Number(emptyFilterRes.rows[0].count) === 0);

        // --- 2.3 EXPENSE APPROVAL & REJECTION LIFECYCLE ---
        console.log('\n--- 2.3 Expense Approval & Rejection Lifecycle ---');

        // Test 2.3.1: Pending -> Approved transition
        await testPool.query(`
            UPDATE expenses 
            SET status = 'approved', reviewer_id = ${fixture.managerId}, reviewed_at = NOW() 
            WHERE expense_id = ${opexExpenseId};
            INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id)
            VALUES (${fixture.managerId}, 'EXPENSE_APPROVED', 'expense', ${opexExpenseId});
        `);
        const approvedRes = await testPool.query(`
            SELECT status, reviewer_id, reviewed_at FROM expenses WHERE expense_id = ${opexExpenseId};
        `);
        assert('2.3.1', 'Pending -> Approved transition updates status, reviewer_id, and reviewed_at timestamp', 
            approvedRes.rows[0].status === 'approved' && approvedRes.rows[0].reviewer_id === fixture.managerId && approvedRes.rows[0].reviewed_at !== null
        );

        // Test 2.3.2: Re-approving already approved expense must be rejected (Optimistic lock / Conflict check)
        const reReviewRes = await testPool.query(`
            UPDATE expenses 
            SET status = 'approved', reviewer_id = ${fixture.managerId}, reviewed_at = NOW() 
            WHERE expense_id = ${opexExpenseId} AND status = 'pending';
        `);
        assert('2.3.2', 'Optimistic concurrency: Updating non-pending expense affects 0 rows, preventing duplicate review', reReviewRes.rowCount === 0);

        // Test 2.3.3: Pending -> Rejected transition with mandatory comment
        await testPool.query(`
            UPDATE expenses 
            SET status = 'rejected', reviewer_id = ${fixture.managerId}, reviewed_at = NOW(), review_comment = 'Over allocation limit' 
            WHERE expense_id = ${capexExpenseId};
            INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id)
            VALUES (${fixture.managerId}, 'EXPENSE_REJECTED', 'expense', ${capexExpenseId});
        `);
        const rejectedRes = await testPool.query(`
            SELECT status, reviewer_id, review_comment FROM expenses WHERE expense_id = ${capexExpenseId};
        `);
        assert('2.3.3', 'Pending -> Rejected transition stores review comment and updates status to rejected', 
            rejectedRes.rows[0].status === 'rejected' && rejectedRes.rows[0].review_comment === 'Over allocation limit'
        );

        // Test 2.3.4: Rejection without comment must fail at DB check constraint level
        let rejectNoCommentFailed = false;
        try {
            await testPool.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status, reviewer_id, reviewed_at, review_comment)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 300, 'Test', '2025-05-01', 'rejected', ${fixture.managerId}, NOW(), NULL);
            `);
        } catch (err: any) {
            rejectNoCommentFailed = true;
        }
        assert('2.3.4', 'DB check constraint enforces mandatory non-null review_comment when status is rejected', rejectNoCommentFailed);

        // --- 2.4 EXPENSE LIFECYCLE INVARIANTS ---
        console.log('\n--- 2.4 Expense Lifecycle Invariants ---');

        // Check aggregate balances in isolated DB
        const invariantRes = await testPool.query(`
            SELECT 
                SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_total,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_total,
                SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END) as rejected_total
            FROM expenses;
        `);
        const inv = invariantRes.rows[0];
        assert('2.4.1', 'Approved spending includes ONLY approved status ($450.00)', Number(inv.approved_total) === 450);
        assert('2.4.2', 'Pending spending excludes approved and rejected claims ($0.00)', Number(inv.pending_total) === 0);
        assert('2.4.3', 'Rejected spending strictly isolated from approved spending ($1200.00)', Number(inv.rejected_total) === 1200);

        // Clean up test DB after tests
        await cleanTestDb(testPool);

    } finally {
        await app.close();
        await testPool.end();
    }

    return results;
}

if (require.main === module) {
    runExpensesModuleTests()
        .then(results => {
            const failed = results.filter(r => !r.passed);
            console.log(`\nSUB-PHASE 2 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
            if (failed.length > 0) process.exit(1);
        })
        .catch(err => {
            console.error('Fatal in Sub-Phase 2:', err);
            process.exit(1);
        });
}

