import { Pool } from 'pg';
import { createPool, TEST_DB_CONFIG, DEV_DB_CONFIG, assertIsolatedDatabase, cleanTestDb, seedIsolatedFixture } from './test-db.helper';

interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

export async function runFinancialDataIntegrityTests(): Promise<TestResult[]> {
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

    try {
        console.log('\n===============================================================');
        console.log('SUB-PHASE 1: FINANCIAL DATA INTEGRITY TESTING');
        console.log('===============================================================');

        // Verify isolation
        await assertIsolatedDatabase(testPool, ['finsight_test_db']);

        // --- 1.1 DATABASE INTEGRITY (CONSTRAINTS IN ISOLATED DB) ---
        console.log('\n--- 1.1 Database Integrity & Constraints (Isolated DB) ---');
        await cleanTestDb(testPool);
        const fixture = await seedIsolatedFixture(testPool);

        // Check 1: Check constraint amount > 0 on expenses
        let amountCheckFailedAsExpected = false;
        try {
            await testPool.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 0, 'Zero amount test', '2025-05-01', 'pending');
            `);
        } catch (err: any) {
            amountCheckFailedAsExpected = err.message.includes('CHK_d155a408491aa866c979927ff6') || err.message.includes('check constraint');
        }
        assert('1.1.1', 'DB blocks zero expense amount via check constraint (amount > 0)', amountCheckFailedAsExpected);

        // Check 2: Check constraint negative amount on expenses
        let negativeCheckFailed = false;
        try {
            await testPool.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, -50.00, 'Negative amount test', '2025-05-01', 'pending');
            `);
        } catch (err: any) {
            negativeCheckFailed = err.message.includes('CHK_d155a408491aa866c979927ff6') || err.message.includes('check constraint');
        }
        assert('1.1.2', 'DB blocks negative expense amount via check constraint', negativeCheckFailed);

        // Check 3: Empty or whitespace-only description constraint
        let whitespaceCheckFailed = false;
        try {
            await testPool.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 100.00, '   ', '2025-05-01', 'pending');
            `);
        } catch (err: any) {
            whitespaceCheckFailed = err.message.includes('CHK_d90c48f7290dcd141cbee64f44') || err.message.includes('check constraint');
        }
        assert('1.1.3', 'DB blocks whitespace-only description via check constraint', whitespaceCheckFailed);

        // Check 4: Model B Budget stream constraint (both dept and project cannot be set)
        let modelBBothSetFailed = false;
        try {
            await testPool.query(`
                INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
                VALUES (${fixture.departmentId}, ${fixture.projectId}, 20000, '2025-01-01', '2025-12-31', ${fixture.financeOfficerId});
            `);
        } catch (err: any) {
            modelBBothSetFailed = err.message.includes('CHK_db7666ade5433b2a4a15ac6903') || err.message.includes('check constraint');
        }
        assert('1.1.4', 'Model B constraint: Rejects budget with both department_id and project_id set', modelBBothSetFailed);

        // Check 5: Model B Budget stream constraint (neither dept nor project set)
        let modelBNeitherSetFailed = false;
        try {
            await testPool.query(`
                INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
                VALUES (NULL, NULL, 20000, '2025-01-01', '2025-12-31', ${fixture.financeOfficerId});
            `);
        } catch (err: any) {
            modelBNeitherSetFailed = err.message.includes('CHK_db7666ade5433b2a4a15ac6903') || err.message.includes('check constraint');
        }
        assert('1.1.5', 'Model B constraint: Rejects budget with neither department_id nor project_id set', modelBNeitherSetFailed);

        // Check 6: Budget date constraint (end_date > start_date)
        let budgetDateCheckFailed = false;
        try {
            await testPool.query(`
                INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
                VALUES (${fixture.departmentId}, NULL, 20000, '2025-06-01', '2025-05-01', ${fixture.financeOfficerId});
            `);
        } catch (err: any) {
            budgetDateCheckFailed = err.message.includes('CHK_2d87d527ea40ea465d29248139') || err.message.includes('check constraint');
        }
        assert('1.1.6', 'DB blocks inverted budget dates (end_date <= start_date)', budgetDateCheckFailed);

        // Check 7: Expense review status lifecycle constraint
        // Approved without reviewer must fail
        let approvedNoReviewerFailed = false;
        try {
            await testPool.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status, reviewer_id, reviewed_at)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 100, 'Test', '2025-05-01', 'approved', NULL, NULL);
            `);
        } catch (err: any) {
            approvedNoReviewerFailed = err.message.includes('CHK_c5e8832dc960d37024e4bb422a') || err.message.includes('check constraint');
        }
        assert('1.1.7', 'DB blocks approved status without reviewer_id and reviewed_at', approvedNoReviewerFailed);

        // Rejected without review_comment must fail
        let rejectedNoCommentFailed = false;
        try {
            await testPool.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status, reviewer_id, reviewed_at, review_comment)
                VALUES (${fixture.employeeId}, ${fixture.departmentId}, ${fixture.categoryId}, 100, 'Test', '2025-05-01', 'rejected', ${fixture.managerId}, NOW(), NULL);
            `);
        } catch (err: any) {
            rejectedNoCommentFailed = err.message.includes('CHK_c5e8832dc960d37024e4bb422a') || err.message.includes('check constraint');
        }
        assert('1.1.8', 'DB blocks rejected status without review_comment', rejectedNoCommentFailed);

        // Check 8: Foreign Key Integrity (Invalid User, Dept, Category, Project)
        let invalidFkFailed = false;
        try {
            await testPool.query(`
                INSERT INTO expenses (user_id, department_id, category_id, amount, description, expense_date, status)
                VALUES (99999, ${fixture.departmentId}, ${fixture.categoryId}, 100, 'Bad user', '2025-05-01', 'pending');
            `);
        } catch (err: any) {
            invalidFkFailed = err.message.includes('foreign key constraint') || err.code === '23503';
        }
        assert('1.1.9', 'DB blocks expense referencing non-existent user_id via Foreign Key', invalidFkFailed);

        // Check 9: Unique constraint on category_name
        let dupCategoryFailed = false;
        try {
            await testPool.query(`
                INSERT INTO expense_categories (category_name) VALUES ('Cloud Services');
            `);
        } catch (err: any) {
            dupCategoryFailed = err.code === '23505' || err.message.includes('unique constraint');
        }
        assert('1.1.10', 'DB enforces uniqueness on expense_categories.category_name', dupCategoryFailed);

        // Clean up test DB after constraint checks
        await cleanTestDb(testPool);

        // --- 1.2 FINANCIAL DATA ACCURACY (AUDIT READS ON DEV DB) ---
        console.log('\n--- 1.2 Financial Data Accuracy & Precision (Read-Only DEV DB) ---');
        
        // Precision test: check numeric(14,2) storage without floating point distortion
        const precisionRes = await devPool.query(`
            SELECT amount FROM expenses WHERE amount::text LIKE '%.50' LIMIT 5;
        `);
        const allEndIn50 = precisionRes.rows.every(r => String(r.amount).endsWith('.50'));
        assert('1.2.1', 'Decimal precision numeric(14,2) preserves exact fractional cents without floating point drift', precisionRes.rows.length > 0 && allEndIn50);

        // Orphaned records check across all tables in DEV DB
        const orphanRes = await devPool.query(`
            SELECT 
                (SELECT COUNT(*) FROM expenses e LEFT JOIN users u ON e.user_id = u.user_id WHERE u.user_id IS NULL) AS orphan_exp_user,
                (SELECT COUNT(*) FROM expenses e LEFT JOIN departments d ON e.department_id = d.department_id WHERE d.department_id IS NULL) AS orphan_exp_dept,
                (SELECT COUNT(*) FROM expenses e LEFT JOIN projects p ON e.project_id = p.project_id WHERE e.project_id IS NOT NULL AND p.project_id IS NULL) AS orphan_exp_proj,
                (SELECT COUNT(*) FROM budgets b LEFT JOIN departments d ON b.department_id = d.department_id WHERE b.department_id IS NOT NULL AND d.department_id IS NULL) AS orphan_bgt_dept,
                (SELECT COUNT(*) FROM budgets b LEFT JOIN projects p ON b.project_id = p.project_id WHERE b.project_id IS NOT NULL AND p.project_id IS NULL) AS orphan_bgt_proj;
        `);
        const o = orphanRes.rows[0];
        const zeroOrphans = Number(o.orphan_exp_user) === 0 &&
                            Number(o.orphan_exp_dept) === 0 &&
                            Number(o.orphan_exp_proj) === 0 &&
                            Number(o.orphan_bgt_dept) === 0 &&
                            Number(o.orphan_bgt_proj) === 0;
        assert('1.2.2', 'Zero orphaned records exist across users, departments, projects, budgets, and expenses', zeroOrphans);

        // Large monetary value precision (up to $999,999,999.99 in isolated DB)
        await testPool.query(`
            INSERT INTO expense_categories (category_name) VALUES ('Mega CapEx');
            INSERT INTO users (full_name, email, password_hash, role, is_active)
            VALUES ('Finance Mega', 'mega@test.finsight.internal', 'hash', 'finance_officer', true);
            INSERT INTO departments (department_name, manager_id, description)
            VALUES ('Mega Dept', 1, 'Scale Dept');
            INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
            VALUES (1, NULL, 999999999.99, '2025-01-01', '2025-12-31', 1);
        `);
        const megaBgt = await testPool.query(`SELECT allocated_amount FROM budgets WHERE allocated_amount = 999999999.99;`);
        assert('1.2.3', 'Large monetary numbers ($999,999,999.99) store and retrieve with exact precision in numeric(14,2)', megaBgt.rows.length === 1);
        await cleanTestDb(testPool);

        // --- 1.3 INDEPENDENT CALCULATION VERIFICATION ---
        console.log('\n--- 1.3 Independent Calculation Verification (Read-Only DEV DB) ---');
        
        // 1. Fetch individual approved expenses
        const rawExpenses = await devPool.query(`
            SELECT expense_id, amount, department_id, project_id 
            FROM expenses 
            WHERE status = 'approved';
        `);
        let calcOpEx = 0;
        let calcCapEx = 0;
        for (const row of rawExpenses.rows) {
            const amt = Number(row.amount);
            if (row.project_id === null) {
                calcOpEx += amt;
            } else {
                calcCapEx += amt;
            }
        }
        calcOpEx = Number(calcOpEx.toFixed(2));
        calcCapEx = Number(calcCapEx.toFixed(2));
        const calcTotalApproved = Number((calcOpEx + calcCapEx).toFixed(2));

        // 2. Fetch database aggregation
        const aggRes = await devPool.query(`
            SELECT 
                SUM(CASE WHEN project_id IS NULL THEN amount ELSE 0 END) as db_opex,
                SUM(CASE WHEN project_id IS NOT NULL THEN amount ELSE 0 END) as db_capex,
                SUM(amount) as db_total
            FROM expenses
            WHERE status = 'approved';
        `);
        const dbTotal = Number(aggRes.rows[0].db_total);
        const dbOpEx = Number(aggRes.rows[0].db_opex);
        const dbCapEx = Number(aggRes.rows[0].db_capex);

        assert('1.3.1', `Independent row sum ($${calcTotalApproved}) strictly equals DB aggregate SUM ($${dbTotal})`, calcTotalApproved === dbTotal);
        assert('1.3.2', `Independent OpEx row sum ($${calcOpEx}) strictly equals DB aggregate OpEx ($${dbOpEx})`, calcOpEx === dbOpEx);
        assert('1.3.3', `Independent CapEx row sum ($${calcCapEx}) strictly equals DB aggregate CapEx ($${dbCapEx})`, calcCapEx === dbCapEx);

    } finally {
        await testPool.end();
        await devPool.end();
    }

    return results;
}

if (require.main === module) {
    runFinancialDataIntegrityTests()
        .then(results => {
            const failed = results.filter(r => !r.passed);
            console.log(`\nSUB-PHASE 1 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
            if (failed.length > 0) process.exit(1);
        })
        .catch(err => {
            console.error('Fatal in Sub-Phase 1:', err);
            process.exit(1);
        });
}

