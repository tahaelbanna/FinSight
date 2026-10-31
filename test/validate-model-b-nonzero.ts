import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GetSummaryUseCase } from '../src/analytics/usecases/get-summary.usecase';
import { ExpenseMetricsQuery } from '../src/expenses/queries/expense-metrics.query';
import { UserRepository } from '../src/users/repositories/users.repository';
import { ExpenseRepository } from '../src/expenses/repositories/expense.repository';
import { BudgetRepository } from '../src/budgets/repositories/budget.repository';
import { User } from '../src/users/schemas/users.schema';
import { Department } from '../src/departments/schemas/departments.schema';
import { Project } from '../src/projects/schemas/project.schema';
import { Budget } from '../src/budgets/schemas/budget.schema';
import { Expense } from '../src/expenses/schemas/expense.schema';
import { ExpenseCategory } from '../src/expenses/schemas/expense-category.schema';
import { ExpenseStatus, UserRole, ProjectStatus } from '../src/common/enums';

async function runNonZeroModelBValidation() {
    const logger = new Logger('ModelBNonZeroValidator');
    logger.log('=== Starting Isolated Deterministic Model B Non-Zero Regression Tests ===');

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['warn', 'error'],
    });

    const dataSource = app.get(DataSource);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Start isolated transaction
    await queryRunner.startTransaction('SERIALIZABLE');
    logger.log('Started SERIALIZABLE transaction for isolated test scenario.');

    try {
        const dummyPasswordHash = '$2b$10$VDNfZiMs2SKbeke8u81Qx.7XCdOA6VtWlPiyki21ODlIhgF8onxHu';

        // 1. Fetch an existing Category
        const catRes = await queryRunner.query(`
            SELECT category_id FROM expense_categories LIMIT 1;
        `);
        const categoryId = String(catRes[0].category_id);

        // 2. Create Manager user (temporarily without dept)
        const mgrRes = await queryRunner.query(`
            INSERT INTO users (full_name, email, password_hash, role, is_active)
            VALUES ('Test Manager NonZero', 'mgr.nonzero@test.internal', '${dummyPasswordHash}', 'manager', true)
            RETURNING user_id;
        `);
        const managerId = String(mgrRes[0].user_id);

        // 3. Create Department referencing Manager
        const deptRes = await queryRunner.query(`
            INSERT INTO departments (department_name, manager_id, description)
            VALUES ('NonZero Test Engineering', ${managerId}, 'Deterministic Dept for Model B')
            RETURNING department_id;
        `);
        const departmentId = String(deptRes[0].department_id);

        // Update Manager with department_id
        await queryRunner.query(`
            UPDATE users SET department_id = ${departmentId} WHERE user_id = ${managerId};
        `);

        // 4. Create Employee user in this department
        const empRes = await queryRunner.query(`
            INSERT INTO users (full_name, email, password_hash, role, department_id, is_active)
            VALUES ('Test Employee NonZero', 'emp.nonzero@test.internal', '${dummyPasswordHash}', 'employee', ${departmentId}, true)
            RETURNING user_id;
        `);
        const employeeId = String(empRes[0].user_id);

        // 5. Create System Admin user (or use existing admin) for querying
        const adminRes = await queryRunner.query(`
            INSERT INTO users (full_name, email, password_hash, role, is_active)
            VALUES ('Test Admin NonZero', 'admin.nonzero@test.internal', '${dummyPasswordHash}', 'admin', true)
            RETURNING user_id;
        `);
        const adminUserId = String(adminRes[0].user_id);

        // 6. Create Project belonging to this department
        const projRes = await queryRunner.query(`
            INSERT INTO projects (project_name, department_id, start_date, end_date, status)
            VALUES ('NonZero Cloud Platform Project', ${departmentId}, '2025-01-01', '2025-12-31', 'active')
            RETURNING project_id;
        `);
        const projectId = String(projRes[0].project_id);

        // 7. Create Department OpEx Budget ($100,000.00)
        const deptBudgetRes = await queryRunner.query(`
            INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
            VALUES (${departmentId}, NULL, 100000.00, '2025-01-01', '2025-12-31', ${adminUserId})
            RETURNING budget_id;
        `);
        const deptBudgetId = String(deptBudgetRes[0].budget_id);

        // 8. Create Project CapEx Budget ($50,000.00)
        const projBudgetRes = await queryRunner.query(`
            INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
            VALUES (NULL, ${projectId}, 50000.00, '2025-01-01', '2025-12-31', ${adminUserId})
            RETURNING budget_id;
        `);
        const projBudgetId = String(projBudgetRes[0].budget_id);

        // 9. Create Expenses:
        // Expense 1: Approved Direct Department OpEx Expense ($12,000.00)
        await queryRunner.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, review_comment, submitted_at, reviewed_at)
            VALUES (${employeeId}, ${departmentId}, NULL, ${categoryId}, 12000.00, 'Direct Dept Software Licenses [TEST]', '2025-03-15', 'approved', ${managerId}, 'Approved OpEx', '2025-03-15 10:00:00Z', '2025-03-16 11:00:00Z');
        `);

        // Expense 2: Approved Project CapEx Expense ($8,000.00)
        await queryRunner.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, review_comment, submitted_at, reviewed_at)
            VALUES (${employeeId}, ${departmentId}, ${projectId}, ${categoryId}, 8000.00, 'Project CapEx Server Hardware [TEST]', '2025-04-20', 'approved', ${managerId}, 'Approved CapEx', '2025-04-20 10:00:00Z', '2025-04-21 11:00:00Z');
        `);

        // Expense 3: Pending Direct Department OpEx Expense ($2,500.00)
        await queryRunner.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, review_comment, submitted_at, reviewed_at)
            VALUES (${employeeId}, ${departmentId}, NULL, ${categoryId}, 2500.00, 'Pending Direct OpEx Consumables [TEST]', '2025-05-10', 'pending', NULL, NULL, '2025-05-10 10:00:00Z', NULL);
        `);

        // Expense 4: Pending Project CapEx Expense ($1,500.00)
        await queryRunner.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, review_comment, submitted_at, reviewed_at)
            VALUES (${employeeId}, ${departmentId}, ${projectId}, ${categoryId}, 1500.00, 'Pending Project Dedicated Gateway [TEST]', '2025-05-20', 'pending', NULL, NULL, '2025-05-20 10:00:00Z', NULL);
        `);

        // Expense 5: Rejected Direct Department OpEx Expense ($4,000.00)
        await queryRunner.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, review_comment, submitted_at, reviewed_at)
            VALUES (${employeeId}, ${departmentId}, NULL, ${categoryId}, 4000.00, 'Rejected Luxury Equipment [TEST]', '2025-06-01', 'rejected', ${managerId}, 'Policy violation', '2025-06-01 10:00:00Z', '2025-06-02 11:00:00Z');
        `);

        // Expense 6: Out-of-window Direct Department OpEx Expense ($7,000.00, dated 2024-11-10)
        await queryRunner.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, review_comment, submitted_at, reviewed_at)
            VALUES (${employeeId}, ${departmentId}, NULL, ${categoryId}, 7000.00, 'Prior Year Direct OpEx [TEST]', '2024-11-10', 'approved', ${managerId}, 'Approved 2024', '2024-11-10 10:00:00Z', '2024-11-11 11:00:00Z');
        `);

        // Expense 7: Out-of-window Project CapEx Expense ($5,000.00, dated 2026-02-15)
        await queryRunner.query(`
            INSERT INTO expenses (user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, review_comment, submitted_at, reviewed_at)
            VALUES (${employeeId}, ${departmentId}, ${projectId}, ${categoryId}, 5000.00, 'Future Year Project CapEx [TEST]', '2026-02-15', 'approved', ${managerId}, 'Approved 2026', '2026-02-15 10:00:00Z', '2026-02-16 11:00:00Z');
        `);

        logger.log('Inserted deterministic scenario with NON-ZERO OpEx and CapEx values.');

        // Instantiate transactional repositories and use cases
        const transactionalUserRepo = new UserRepository(queryRunner.manager.getRepository(User));
        const transactionalExpenseRepo = new ExpenseRepository(queryRunner.manager.getRepository(Expense));
        const transactionalBudgetRepo = new BudgetRepository(queryRunner.manager.getRepository(Budget));
        const mockI18n = { translate: (key: string) => key } as any;

        const transactionalGetSummary = new GetSummaryUseCase(
            transactionalUserRepo,
            transactionalExpenseRepo,
            transactionalBudgetRepo,
            mockI18n,
        );

        const transactionalExpenseMetrics = new ExpenseMetricsQuery(
            queryRunner.manager.getRepository(Expense),
        );

        // =========================================================================
        // TEST 1: Department Summary Consolidated Budget & Spending (2025 Window)
        // =========================================================================
        logger.log('\n--- TEST 1: Department Summary Consolidated Budget & Spending (2025) ---');
        const summary2025 = await transactionalGetSummary.execute(
            {
                department_id: departmentId,
                date_from: '2025-01-01',
                date_to: '2025-12-31',
            },
            adminUserId,
        );

        logger.log(`  Reported total_budget: $${summary2025.total_budget}`);
        logger.log(`  Reported total_approved_expenses: $${summary2025.total_approved_expenses}`);
        logger.log(`  Reported total_pending_expenses: $${summary2025.total_pending_expenses}`);
        logger.log(`  Reported utilization_percentage: ${summary2025.utilization_percentage}%`);

        // Verification 1.1: Department Summary Budget = OpEx ($100,000) + CapEx ($50,000) = $150,000
        const expectedBudget = 150000.00;
        if (summary2025.total_budget !== expectedBudget) {
            throw new Error(`TEST 1.1 FAILED: Expected total_budget $${expectedBudget}, got $${summary2025.total_budget}`);
        }
        logger.log('  [PASS] Department summary budget = OpEx ($100,000) + CapEx ($50,000) = $150,000.00');

        // Verification 1.2: Department Summary Spending = Direct OpEx ($12,000) + Project CapEx ($8,000) = $20,000
        const expectedApproved = 20000.00;
        if (summary2025.total_approved_expenses !== expectedApproved) {
            throw new Error(`TEST 1.2 FAILED: Expected total_approved_expenses $${expectedApproved}, got $${summary2025.total_approved_expenses}`);
        }
        logger.log('  [PASS] Department summary spending = Direct OpEx ($12,000) + Project CapEx ($8,000) = $20,000.00');

        // Verification 1.3: Each expense counted exactly once
        // Direct OpEx = 12000, Project CapEx = 8000. Sum = 20000. No double counting.
        const directOpExSpend: number = 12000.00;
        const projectCapExSpend: number = 8000.00;
        if (directOpExSpend + projectCapExSpend !== summary2025.total_approved_expenses) {
            throw new Error(`TEST 1.3 FAILED: Double counting detected!`);
        }
        logger.log('  [PASS] Single-count verified: OpEx ($12,000) + CapEx ($8,000) = Total ($20,000). Both non-zero!');

        // Verification 1.4: Pending expenses
        const expectedPending = 4000.00; // $2,500 (OpEx) + $1,500 (CapEx)
        if (summary2025.total_pending_expenses !== expectedPending) {
            throw new Error(`TEST 1.4 FAILED: Expected pending $${expectedPending}, got $${summary2025.total_pending_expenses}`);
        }
        logger.log('  [PASS] Pending expenses consolidated = Direct ($2,500) + Project ($1,500) = $4,000.00');

        // Verification 1.5: Utilization Percentage
        // (20,000 / 150,000) * 100 = 13.33%
        const expectedUtil = 13.33;
        if (summary2025.utilization_percentage !== expectedUtil) {
            throw new Error(`TEST 1.5 FAILED: Expected utilization ${expectedUtil}%, got ${summary2025.utilization_percentage}%`);
        }
        logger.log(`  [PASS] Utilization percentage accurately computed at ${expectedUtil}%`);

        // =========================================================================
        // TEST 2: ExpenseMetricsQuery Department Scope Isolation (OpEx Only)
        // =========================================================================
        logger.log('\n--- TEST 2: ExpenseMetricsQuery Department Scope (OpEx Isolation) ---');
        const deptOpExMetrics = await transactionalExpenseMetrics.getTotalApprovedByScope(
            new Date('2025-01-01'),
            new Date('2025-12-31'),
            departmentId,
            undefined, // no project_id
        );

        logger.log(`  ExpenseMetricsQuery returned for Dept: $${deptOpExMetrics}`);
        if (deptOpExMetrics !== directOpExSpend) {
            throw new Error(`TEST 2 FAILED: Expected strictly OpEx $${directOpExSpend}, got $${deptOpExMetrics}`);
        }
        if ((deptOpExMetrics as number) === (summary2025.total_approved_expenses as number)) {
            throw new Error(`TEST 2 FAILED: Department budget metrics incorrectly included project CapEx spending!`);
        }
        logger.log('  [PASS] Department budget metrics STRICTLY EXCLUDE project expenses (Returns $12,000, not $20,000)');

        // =========================================================================
        // TEST 3: ExpenseMetricsQuery Project Scope Isolation (CapEx Only)
        // =========================================================================
        logger.log('\n--- TEST 3: ExpenseMetricsQuery Project Scope (CapEx Isolation) ---');
        const projCapExMetrics = await transactionalExpenseMetrics.getTotalApprovedByScope(
            new Date('2025-01-01'),
            new Date('2025-12-31'),
            undefined,
            projectId,
        );

        logger.log(`  ExpenseMetricsQuery returned for Project: $${projCapExMetrics}`);
        if (projCapExMetrics !== projectCapExSpend) {
            throw new Error(`TEST 3 FAILED: Expected strictly CapEx $${projectCapExSpend}, got $${projCapExMetrics}`);
        }
        logger.log('  [PASS] Project budget metrics STRICTLY INCLUDE ONLY expenses belonging to that project ($8,000.00)');

        // =========================================================================
        // TEST 4: GetSummaryUseCase Filtered by project_id
        // =========================================================================
        logger.log('\n--- TEST 4: GetSummaryUseCase Filtered by project_id ---');
        const projSummary2025 = await transactionalGetSummary.execute(
            {
                project_id: projectId,
                date_from: '2025-01-01',
                date_to: '2025-12-31',
            },
            adminUserId,
        );

        logger.log(`  Project Scope total_budget: $${projSummary2025.total_budget}`);
        logger.log(`  Project Scope total_approved_expenses: $${projSummary2025.total_approved_expenses}`);
        logger.log(`  Project Scope total_pending_expenses: $${projSummary2025.total_pending_expenses}`);
        logger.log(`  Project Scope utilization: ${projSummary2025.utilization_percentage}%`);

        if (projSummary2025.total_budget !== 50000.00) {
            throw new Error(`TEST 4 FAILED: Expected project budget $50,000, got $${projSummary2025.total_budget}`);
        }
        if (projSummary2025.total_approved_expenses !== 8000.00) {
            throw new Error(`TEST 4 FAILED: Expected project spending $8,000, got $${projSummary2025.total_approved_expenses}`);
        }
        if (projSummary2025.total_pending_expenses !== 1500.00) {
            throw new Error(`TEST 4 FAILED: Expected project pending $1,500, got $${projSummary2025.total_pending_expenses}`);
        }
        if (projSummary2025.utilization_percentage !== 16.00) {
            throw new Error(`TEST 4 FAILED: Expected project utilization 16.00%, got ${projSummary2025.utilization_percentage}%`);
        }
        logger.log('  [PASS] Project-scoped GetSummaryUseCase isolated to project budget ($50k) and spend ($8k)');

        // =========================================================================
        // TEST 5: Date Window Filtering (Excludes 2024 and 2026 out-of-window records)
        // =========================================================================
        logger.log('\n--- TEST 5: Date Window Filtering ---');
        const allTimeSummary = await transactionalGetSummary.execute(
            { department_id: departmentId },
            adminUserId,
        );

        // All time approved spend = 2024 OpEx ($7,000) + 2025 OpEx ($12,000) + 2025 CapEx ($8,000) + 2026 CapEx ($5,000) = $32,000
        const expectedAllTimeApproved = 32000.00;
        logger.log(`  All-Time approved spend: $${allTimeSummary.total_approved_expenses}`);
        if (allTimeSummary.total_approved_expenses !== expectedAllTimeApproved) {
            throw new Error(`TEST 5 FAILED: Expected all-time approved $${expectedAllTimeApproved}, got $${allTimeSummary.total_approved_expenses}`);
        }
        logger.log('  [PASS] All-time query includes out-of-window expenses ($32,000.00)');
        logger.log('  [PASS] Date filters (2025-01-01 to 2025-12-31) strictly filtered $32,000.00 down to $20,000.00');

        // =========================================================================
        // TEST 6: Role-Based Access Control (RBAC) Scoping
        // =========================================================================
        logger.log('\n--- TEST 6: Role-Based Access Control Scoping ---');
        // Manager querying without passing department_id
        const mgrSummary = await transactionalGetSummary.execute({}, managerId);
        if (mgrSummary.total_budget !== summary2025.total_budget || mgrSummary.total_approved_expenses !== allTimeSummary.total_approved_expenses) {
            throw new Error(`TEST 6.1 FAILED: Manager scoping failed!`);
        }
        logger.log('  [PASS] Manager is automatically scoped to their own department');

        // Employee querying: budget must be 0
        const empSummary = await transactionalGetSummary.execute({}, employeeId);
        if (empSummary.total_budget !== 0) {
            throw new Error(`TEST 6.2 FAILED: Employee saw non-zero budget $${empSummary.total_budget}`);
        }
        logger.log('  [PASS] Employee role returns total_budget = 0');

        logger.log('\n=================================================================');
        logger.log('ALL NON-ZERO MODEL B REGRESSION TESTS PASSED WITH 100% SUCCESS!');
        logger.log('=================================================================');
    } finally {
        // Rollback transaction to ensure zero changes in database
        logger.log('\nExecuting ROLLBACK of test transaction...');
        await queryRunner.rollbackTransaction();
        logger.log('Transaction rolled back cleanly.');

        // Verify database residue is exactly 0
        const checkDepts = await dataSource.query(`SELECT count(*) FROM departments WHERE department_name = 'NonZero Test Engineering';`);
        const checkExpenses = await dataSource.query(`SELECT count(*) FROM expenses WHERE description LIKE '%[TEST]%';`);
        const deptsRemaining = parseInt(checkDepts[0].count, 10);
        const expensesRemaining = parseInt(checkExpenses[0].count, 10);

        if (deptsRemaining !== 0 || expensesRemaining !== 0) {
            logger.error(`DATABASE DIRTY: Found ${deptsRemaining} depts and ${expensesRemaining} expenses after rollback!`);
            process.exitCode = 1;
        } else {
            logger.log(`Verified Clean State: 0 test departments and 0 test expenses remain in database.`);
        }

        await queryRunner.release();
        await app.close();
    }
}

runNonZeroModelBValidation().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
