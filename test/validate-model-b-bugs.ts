import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { GetSummaryUseCase } from '../src/analytics/usecases/get-summary.usecase';
import { ExpenseMetricsQuery } from '../src/expenses/queries/expense-metrics.query';
import { UserRepository } from '../src/users/repositories/users.repository';
import { DepartmentRepository } from '../src/departments/repositories/department.repository';
import { ProjectRepository } from '../src/projects/repositories/project.repository';
import { BudgetRepository } from '../src/budgets/repositories/budget.repository';
import { ExpenseRepository } from '../src/expenses/repositories/expense.repository';
import { ExpenseStatus, UserRole } from '../src/common/enums';
import { DataSource } from 'typeorm';

async function runRegressionTests() {
    const logger = new Logger('ModelBRegressionValidator');
    logger.log('Starting Regression Tests for Bug 1 (GetSummaryUseCase) and Bug 2 (ExpenseMetricsQuery)...');

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['warn', 'error'],
    });

    try {
        const dataSource = app.get(DataSource);
        const getSummaryUseCase = app.get(GetSummaryUseCase);
        const expenseMetricsQuery = app.get(ExpenseMetricsQuery);
        const userRepo = app.get(UserRepository);
        const deptRepo = app.get(DepartmentRepository);
        const projectRepo = app.get(ProjectRepository);
        const budgetRepo = app.get(BudgetRepository);

        // Fetch test identities
        const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
        if (!admin) throw new Error('No admin user found!');

        const manager = await userRepo.findOne({ where: { role: UserRole.MANAGER } });
        if (!manager || !manager.department_id) throw new Error('No manager user with department found!');

        const employee = await userRepo.findOne({ where: { role: UserRole.EMPLOYEE } });
        if (!employee) throw new Error('No employee user found!');

        const targetDeptId = manager.department_id;
        const dept = await deptRepo.findById(targetDeptId);
        logger.log(`Using Department for Tests: ${dept?.department_name} (ID: ${targetDeptId})`);

        // =========================================================================
        // Test Suite 1: Bug 1 - GetSummaryUseCase Model B Alignment
        // =========================================================================
        logger.log('--- Test 1.1: Department Summary Consolidated Budget (OpEx + CapEx) ---');
        const summary = await getSummaryUseCase.execute(
            { department_id: targetDeptId },
            admin.user_id,
        );

        // Compute direct OpEx budget sum from DB
        const opExBudgetRes = await dataSource.query(`
            SELECT COALESCE(SUM(allocated_amount), 0) AS total
            FROM budgets
            WHERE department_id = $1 AND project_id IS NULL;
        `, [targetDeptId]);
        const opExBudget = Number(opExBudgetRes[0].total);

        // Compute project CapEx budget sum for this department from DB
        const capExBudgetRes = await dataSource.query(`
            SELECT COALESCE(SUM(b.allocated_amount), 0) AS total
            FROM budgets b
            JOIN projects p ON b.project_id = p.project_id
            WHERE p.department_id = $1;
        `, [targetDeptId]);
        const capExBudget = Number(capExBudgetRes[0].total);

        const expectedConsolidatedBudget = opExBudget + capExBudget;
        logger.log(`  OpEx Budget: $${opExBudget} | CapEx Budget: $${capExBudget} | Total: $${expectedConsolidatedBudget}`);
        logger.log(`  GetSummaryUseCase returned total_budget: $${summary.total_budget}`);

        if (summary.total_budget !== expectedConsolidatedBudget) {
            throw new Error(`Bug 1 regression: Expected total_budget ${expectedConsolidatedBudget}, got ${summary.total_budget}`);
        }
        if (summary.total_budget <= opExBudget && capExBudget > 0) {
            throw new Error('Bug 1 regression: CapEx project budgets were ignored in department summary!');
        }
        logger.log(' Passed: Department total_budget includes both OpEx and CapEx.');

        logger.log('--- Test 1.2: Department Summary Single-Counted Consolidated Spending ---');
        // Compute direct OpEx spending from DB
        const opExSpendRes = await dataSource.query(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE department_id = $1 AND project_id IS NULL AND status = 'approved';
        `, [targetDeptId]);
        const opExSpend = Number(opExSpendRes[0].total);

        // Compute project CapEx spending from DB
        const capExSpendRes = await dataSource.query(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE department_id = $1 AND project_id IS NOT NULL AND status = 'approved';
        `, [targetDeptId]);
        const capExSpend = Number(capExSpendRes[0].total);

        const expectedConsolidatedSpend = Number((opExSpend + capExSpend).toFixed(2));
        logger.log(`  OpEx Approved Spend: $${opExSpend} | CapEx Approved Spend: $${capExSpend} | Total: $${expectedConsolidatedSpend}`);
        logger.log(`  GetSummaryUseCase returned total_approved_expenses: $${summary.total_approved_expenses}`);

        if (Math.abs(summary.total_approved_expenses - expectedConsolidatedSpend) > 0.01) {
            throw new Error(`Bug 1 regression: Expected total_approved_expenses ${expectedConsolidatedSpend}, got ${summary.total_approved_expenses}`);
        }
        logger.log(' Passed: Department spending equals OpEx + CapEx without double-counting.');

        logger.log('--- Test 1.3: Project Filter Isolation in GetSummaryUseCase ---');
        const deptProjects = await projectRepo.find({ where: { department_id: targetDeptId } });
        if (deptProjects.length === 0) throw new Error('No projects found in department');
        const sampleProj = deptProjects[0];

        const projSummary = await getSummaryUseCase.execute(
            { project_id: sampleProj.project_id },
            admin.user_id,
        );

        const projBudgetRes = await dataSource.query(`
            SELECT COALESCE(SUM(allocated_amount), 0) AS total
            FROM budgets
            WHERE project_id = $1;
        `, [sampleProj.project_id]);
        const expectedProjBudget = Number(projBudgetRes[0].total);

        const projSpendRes = await dataSource.query(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE project_id = $1 AND status = 'approved';
        `, [sampleProj.project_id]);
        const expectedProjSpend = Number(projSpendRes[0].total);

        if (projSummary.total_budget !== expectedProjBudget) {
            throw new Error(`Project filter failed: Expected budget ${expectedProjBudget}, got ${projSummary.total_budget}`);
        }
        if (Math.abs(projSummary.total_approved_expenses - expectedProjSpend) > 0.01) {
            throw new Error(`Project filter failed: Expected spending ${expectedProjSpend}, got ${projSummary.total_approved_expenses}`);
        }
        logger.log(` Passed: Project filter correctly isolated to project budget ($${projSummary.total_budget}) and spending ($${projSummary.total_approved_expenses}).`);

        logger.log('--- Test 1.4: Employee Role Restrictions in GetSummaryUseCase ---');
        const empSummary = await getSummaryUseCase.execute({}, employee.user_id);
        if (empSummary.total_budget !== 0) {
            throw new Error(`Employee role violation: Expected total_budget 0, got ${empSummary.total_budget}`);
        }
        logger.log(' Passed: Employee role returns total_budget = 0.');

        logger.log('--- Test 1.5: Manager Scoping in GetSummaryUseCase ---');
        const mgrSummary = await getSummaryUseCase.execute({}, manager.user_id);
        if (mgrSummary.total_budget !== summary.total_budget) {
            throw new Error(`Manager scoping failed: Expected total_budget ${summary.total_budget}, got ${mgrSummary.total_budget}`);
        }
        logger.log(' Passed: Manager automatically scoped to own department consolidated budget.');

        // =========================================================================
        // Test Suite 2: Bug 2 - ExpenseMetricsQuery Model B OpEx Separation
        // =========================================================================
        logger.log('--- Test 2.1: ExpenseMetricsQuery Department Scope Must Exclude Project Expenses ---');
        // Find a department budget
        const deptBudget = await budgetRepo.findOne({
            where: { department_id: targetDeptId },
        });
        if (!deptBudget) throw new Error('No department budget found');

        const deptApprovedSpend = await expenseMetricsQuery.getTotalApprovedByScope(
            deptBudget.start_date,
            deptBudget.end_date,
            deptBudget.department_id,
            undefined, // no project_id
        );

        // Directly query DB for OpEx spending (project_id IS NULL)
        const dbOpExRes = await dataSource.query(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE department_id = $1 
              AND project_id IS NULL 
              AND status = 'approved'
              AND expense_date >= $2
              AND expense_date <= $3;
        `, [deptBudget.department_id, deptBudget.start_date, deptBudget.end_date]);
        const dbOpEx = Number(dbOpExRes[0].total);

        // Query all department expenses including projects
        const dbAllDeptRes = await dataSource.query(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE department_id = $1 
              AND status = 'approved'
              AND expense_date >= $2
              AND expense_date <= $3;
        `, [deptBudget.department_id, deptBudget.start_date, deptBudget.end_date]);
        const dbAllDept = Number(dbAllDeptRes[0].total);

        logger.log(`  OpEx Expenses in window: $${dbOpEx}`);
        logger.log(`  All Dept Expenses in window (OpEx + CapEx): $${dbAllDept}`);
        logger.log(`  ExpenseMetricsQuery returned: $${deptApprovedSpend}`);

        if (Math.abs(deptApprovedSpend - dbOpEx) > 0.01) {
            throw new Error(`Bug 2 regression: ExpenseMetricsQuery returned ${deptApprovedSpend}, expected strictly OpEx ${dbOpEx}`);
        }
        if (deptApprovedSpend === dbAllDept && dbAllDept > dbOpEx) {
            throw new Error('Bug 2 regression: ExpenseMetricsQuery included project expenses in department budget!');
        }
        logger.log(' Passed: ExpenseMetricsQuery department scope excludes project expenses (OpEx only).');

        logger.log('--- Test 2.2: ExpenseMetricsQuery Project Scope ---');
        const projBudget = await budgetRepo.findOne({
            where: { project_id: sampleProj.project_id },
        });
        if (!projBudget) throw new Error('No project budget found');

        const projApprovedSpend = await expenseMetricsQuery.getTotalApprovedByScope(
            projBudget.start_date,
            projBudget.end_date,
            undefined,
            projBudget.project_id,
        );

        const dbProjRes = await dataSource.query(`
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE project_id = $1
              AND status = 'approved'
              AND expense_date >= $2
              AND expense_date <= $3;
        `, [projBudget.project_id, projBudget.start_date, projBudget.end_date]);
        const dbProjSpend = Number(dbProjRes[0].total);

        if (Math.abs(projApprovedSpend - dbProjSpend) > 0.01) {
            throw new Error(`Project scope failed: Expected ${dbProjSpend}, got ${projApprovedSpend}`);
        }
        logger.log(` Passed: ExpenseMetricsQuery project scope strictly matches project expenses ($${projApprovedSpend}).`);

        logger.log('--- Test 2.3: ExpenseMetricsQuery Recent Expenses OpEx Isolation ---');
        const recentDeptExpenses = await expenseMetricsQuery.getRecentExpensesByScope(
            deptBudget.start_date,
            deptBudget.end_date,
            10,
            deptBudget.department_id,
            undefined,
        );

        for (const exp of recentDeptExpenses) {
            if (exp.project_id !== null && exp.project_id !== undefined) {
                throw new Error(`Bug 2 regression: Recent department expenses contained project expense ID: ${exp.expense_id}`);
            }
        }
        logger.log(` Passed: All ${recentDeptExpenses.length} recent department budget expenses have project_id = null.`);

        logger.log('=================================================================');
        logger.log('ALL REGRESSION TESTS FOR BUG 1 AND BUG 2 PASSED WITH 100% SUCCESS!');
        logger.log('=================================================================');
    } catch (error) {
        logger.error('Regression testing failed:', error);
        process.exitCode = 1;
    } finally {
        await app.close();
    }
}

runRegressionTests();
