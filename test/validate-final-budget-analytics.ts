import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { GetSummaryUseCase } from '../src/analytics/usecases/get-summary.usecase';
import { GetDepartmentComparisonUseCase } from '../src/analytics/usecases/get-department-comparison.usecase';
import { GetProjectPerformanceUseCase } from '../src/analytics/usecases/get-project-performance.usecase';
import { UserRepository } from '../src/users/repositories/users.repository';
import { ProjectRepository } from '../src/projects/repositories/project.repository';
import { DepartmentRepository } from '../src/departments/repositories/department.repository';
import { BudgetRepository } from '../src/budgets/repositories/budget.repository';
import { UserRole } from '../src/common/enums';
import { ForbiddenException } from '../src/common/error-handling/custom-exceptions/forbidden.exception';

async function runFinalBudgetAnalyticsValidation() {
    const logger = new Logger('FinalBudgetAnalyticsValidator');
    logger.log('====================================================================');
    logger.log('FINSIGHT FINAL BUDGET ANALYTICS CORRECTION VALIDATION');
    logger.log('====================================================================\n');

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['warn', 'error'],
    });

    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, message: string, detail?: any) {
        if (!condition) {
            logger.error(`❌ [FAIL] ${message}`);
            if (detail !== undefined) logger.error('   Detail:', detail);
            failed++;
            throw new Error(message);
        } else {
            logger.log(`✅ [PASS] ${message}`);
            passed++;
        }
    }

    try {
        const summaryUseCase = app.get(GetSummaryUseCase);
        const deptCompUseCase = app.get(GetDepartmentComparisonUseCase);
        const projPerfUseCase = app.get(GetProjectPerformanceUseCase);
        const userRepo = app.get(UserRepository);
        const deptRepo = app.get(DepartmentRepository);
        const projRepo = app.get(ProjectRepository);
        const budgetRepo = app.get(BudgetRepository);

        const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
        if (!admin) throw new Error('No admin user found!');

        const manager = await userRepo.findOne({ where: { role: UserRole.MANAGER } });
        if (!manager || !manager.department_id) throw new Error('No manager user with department found!');

        const employee = await userRepo.findOne({ where: { role: UserRole.EMPLOYEE } });
        if (!employee) throw new Error('No employee user found!');

        const expectedGlobalBudget = 8668000;
        const expectedGlobalSpend = 6498290;
        const targetDeptId = manager.department_id;

        // =====================================================================
        // TEST SUITE 1: Full authorized budget remaining unchanged across date ranges
        // =====================================================================
        logger.log('\n--- 1. FULL AUTHORIZED BUDGET REMAINING UNCHANGED ACROSS DATE RANGES ---');

        // 1.1 Summary Endpoint: All-time vs FY 2025 vs H1 2025 vs Future 2035
        const summaryAllTime = await summaryUseCase.execute({}, admin.user_id);
        const summaryFY25 = await summaryUseCase.execute(
            { date_from: '2025-01-01', date_to: '2025-12-31' },
            admin.user_id,
        );
        const summaryH1_25 = await summaryUseCase.execute(
            { date_from: '2025-01-01', date_to: '2025-06-30' },
            admin.user_id,
        );
        const summary2035 = await summaryUseCase.execute(
            { date_from: '2035-01-01', date_to: '2035-12-31' },
            admin.user_id,
        );

        assert(
            summaryAllTime.total_budget === expectedGlobalBudget,
            `1.1a Summary All-Time authorized budget equals $${expectedGlobalBudget}`,
            summaryAllTime.total_budget,
        );
        assert(
            summaryFY25.total_budget === expectedGlobalBudget,
            `1.1b Summary FY 2025 authorized budget remains unchanged at $${expectedGlobalBudget} (was prorated to $2.8695M previously)`,
            summaryFY25.total_budget,
        );
        assert(
            summaryH1_25.total_budget === expectedGlobalBudget,
            `1.1c Summary H1 2025 authorized budget remains unchanged at $${expectedGlobalBudget}`,
            summaryH1_25.total_budget,
        );
        assert(
            summary2035.total_budget === expectedGlobalBudget,
            `1.1d Summary Future (2035) authorized budget remains unchanged at $${expectedGlobalBudget}`,
            summary2035.total_budget,
        );

        // 1.2 Department Comparison: All-time vs H1 2025 vs 2035
        const deptAllTime = await deptCompUseCase.execute({}, admin.user_id);
        const deptH1_25 = await deptCompUseCase.execute(
            { date_from: '2025-01-01', date_to: '2025-06-30' },
            admin.user_id,
        );
        const dept2035 = await deptCompUseCase.execute(
            { date_from: '2035-01-01', date_to: '2035-12-31' },
            admin.user_id,
        );

        let allDeptsBudgetsUnchanged = true;
        for (const dAll of deptAllTime) {
            const dH1 = deptH1_25.find((d) => d.department.department_id === dAll.department.department_id);
            const d35 = dept2035.find((d) => d.department.department_id === dAll.department.department_id);
            if (!dH1 || dH1.allocatedBudget !== dAll.allocatedBudget) allDeptsBudgetsUnchanged = false;
            if (!d35 || d35.allocatedBudget !== dAll.allocatedBudget) allDeptsBudgetsUnchanged = false;
        }
        assert(
            allDeptsBudgetsUnchanged && deptAllTime.length === 6,
            '1.2 Department Comparison: All 6 departments retain exact authorized budgets across all date windows',
        );

        // 1.3 Project Performance: All-time vs H1 2025 vs 2035
        const projAllTime = await projPerfUseCase.execute({}, admin.user_id);
        const projH1_25 = await projPerfUseCase.execute(
            { date_from: '2025-01-01', date_to: '2025-06-30' },
            admin.user_id,
        );
        const proj2035 = await projPerfUseCase.execute(
            { date_from: '2035-01-01', date_to: '2035-12-31' },
            admin.user_id,
        );

        let allProjBudgetsUnchanged = true;
        for (const pAll of projAllTime) {
            const pH1 = projH1_25.find((p) => p.project_id === pAll.project_id);
            const p35 = proj2035.find((p) => p.project_id === pAll.project_id);
            if (!pH1 || pH1.allocated_budget !== pAll.allocated_budget) allProjBudgetsUnchanged = false;
            if (!p35 || p35.allocated_budget !== pAll.allocated_budget) allProjBudgetsUnchanged = false;
        }
        assert(
            allProjBudgetsUnchanged && projAllTime.length === 18,
            '1.3 Project Performance: All 18 projects retain exact authorized CapEx budgets across all date windows',
        );

        // =====================================================================
        // TEST SUITE 2: Period spending changing according to the selected date range
        // =====================================================================
        logger.log('\n--- 2. PERIOD SPENDING CHANGING ACCORDING TO SELECTED DATE RANGE ---');

        assert(
            summaryAllTime.total_approved_expenses === expectedGlobalSpend,
            `2.1a Summary All-Time approved spend is $${expectedGlobalSpend}`,
            summaryAllTime.total_approved_expenses,
        );
        assert(
            summaryFY25.total_approved_expenses === 3541815,
            `2.1b Summary FY 2025 period spend correctly filters to $3,541,815`,
            summaryFY25.total_approved_expenses,
        );
        assert(
            summaryH1_25.total_approved_expenses === 1927529.5,
            `2.1c Summary H1 2025 period spend correctly filters to $1,927,529.50`,
            summaryH1_25.total_approved_expenses,
        );
        assert(
            summary2035.total_approved_expenses === 0,
            `2.1d Summary Future (2035) period spend correctly reports $0 (no expenses in 2035)`,
            summary2035.total_approved_expenses,
        );

        // Check monotonicity: AllTime spend > FY25 spend > H1 2025 spend > 2035 spend
        assert(
            summaryAllTime.total_approved_expenses > summaryFY25.total_approved_expenses &&
            summaryFY25.total_approved_expenses > summaryH1_25.total_approved_expenses &&
            summaryH1_25.total_approved_expenses > summary2035.total_approved_expenses,
            '2.2 Period spend demonstrates strict monotonic sensitivity to narrowing date ranges',
        );

        // =====================================================================
        // TEST SUITE 3: Project CapEx remaining independently calculated
        // =====================================================================
        logger.log('\n--- 3. PROJECT CAPEX REMAINING INDEPENDENTLY CALCULATED ---');

        // Verify that overrun project does not affect other projects
        const overrunProjects = projAllTime.filter((p) => p.total_spent > p.allocated_budget);
        const nonOverrunProjects = projAllTime.filter((p) => p.total_spent <= p.allocated_budget);

        assert(
            overrunProjects.length > 0 && nonOverrunProjects.length > 0,
            `3.1 Portfolio contains both overrun (${overrunProjects.length}) and non-overrun (${nonOverrunProjects.length}) projects`,
        );

        for (const op of overrunProjects) {
            const expectedRemaining = Number((op.allocated_budget - op.total_spent).toFixed(2));
            assert(
                op.remaining_budget === expectedRemaining && op.remaining_budget < 0,
                `3.2 Overrun project "${op.project_name}" has independent deficit of $${Math.abs(op.remaining_budget)} with no offset`,
            );
        }

        for (const nop of nonOverrunProjects) {
            const expectedRemaining = Number((nop.allocated_budget - nop.total_spent).toFixed(2));
            assert(
                nop.remaining_budget === expectedRemaining && nop.remaining_budget >= 0,
                `3.3 Non-overrun project "${nop.project_name}" preserves its independent positive surplus of $${nop.remaining_budget}`,
            );
        }

        // Test project_id filter in Summary endpoint
        const sampleProject = projAllTime[0];
        const projSummary = await summaryUseCase.execute(
            { project_id: sampleProject.project_id },
            admin.user_id,
        );
        assert(
            projSummary.total_budget === sampleProject.allocated_budget &&
            projSummary.total_approved_expenses === sampleProject.total_spent &&
            projSummary.remaining_budget === sampleProject.remaining_budget,
            `3.4 Summary endpoint with project_id filter reconciles 100% with Project Performance item ("${sampleProject.project_name}")`,
        );

        // =====================================================================
        // TEST SUITE 4: No division-by-zero or NaN utilization
        // =====================================================================
        logger.log('\n--- 4. NO DIVISION-BY-ZERO OR NAN UTILIZATION ---');

        // 4.1 Future date window (2035) with 0 spend
        assert(
            !Number.isNaN(summary2035.utilization_percentage) &&
            summary2035.utilization_percentage === 0 &&
            Number.isFinite(summary2035.utilization_percentage),
            '4.1 Summary 2035 utilization is 0.00% (finite, not NaN)',
        );

        for (const p of proj2035) {
            assert(
                !Number.isNaN(p.utilization_percentage) &&
                p.utilization_percentage === 0 &&
                Number.isFinite(p.utilization_percentage),
                `4.2 Project "${p.project_name}" 2035 utilization is 0% (finite, not NaN)`,
            );
        }

        // 4.3 Employee role (total_budget = 0)
        const empSummary = await summaryUseCase.execute({}, employee.user_id);
        assert(
            empSummary.total_budget === 0 &&
            empSummary.utilization_percentage === 0 &&
            !Number.isNaN(empSummary.utilization_percentage) &&
            empSummary.remaining_budget === 0,
            '4.3 Employee role zero-budget query returns utilization_percentage = 0 (no division-by-zero, no NaN)',
        );

        // 4.4 Department Comparison for future date window
        for (const d of dept2035) {
            assert(
                !Number.isNaN(d.utilizationPercentage) &&
                d.utilizationPercentage === 0 &&
                Number.isFinite(d.utilizationPercentage),
                `4.4 Dept "${d.department.department_name}" 2035 utilization is 0% (not NaN, not null)`,
            );
        }

        // =====================================================================
        // TEST SUITE 5: Consistent budget semantics across all Analytics endpoints
        // =====================================================================
        logger.log('\n--- 5. CONSISTENT BUDGET SEMANTICS ACROSS ALL ANALYTICS ENDPOINTS ---');

        // 5.1 Sum of Department Comparison budgets equals Summary total_budget
        const deptBudgetSum = deptAllTime.reduce((sum, d) => sum + d.allocatedBudget, 0);
        assert(
            deptBudgetSum === summaryAllTime.total_budget,
            `5.1 Sum of all 6 Department Comparison budgets ($${deptBudgetSum}) equals Summary total_budget ($${summaryAllTime.total_budget})`,
        );

        // 5.2 Sum of Department Comparison approved spend equals Summary total_approved_expenses across dates
        const checkSpendReconciliation = async (filter: any, label: string) => {
            const s = await summaryUseCase.execute(filter, admin.user_id);
            const dList = await deptCompUseCase.execute(filter, admin.user_id);
            const dSpendSum = Number(dList.reduce((sum, d) => sum + d.totalApproved, 0).toFixed(2));
            assert(
                dSpendSum === s.total_approved_expenses,
                `5.2 ${label}: Department Comparison spend sum ($${dSpendSum}) === Summary approved spend ($${s.total_approved_expenses})`,
            );
        };

        await checkSpendReconciliation({}, 'All-Time');
        await checkSpendReconciliation({ date_from: '2025-01-01', date_to: '2025-12-31' }, 'FY 2025');
        await checkSpendReconciliation({ date_from: '2025-01-01', date_to: '2025-06-30' }, 'H1 2025');
        await checkSpendReconciliation({ date_from: '2035-01-01', date_to: '2035-12-31' }, 'Future 2035');

        // 5.3 Manager scoped consistency: Summary dept budget === Dept Comparison dept budget
        const mgrSummary = await summaryUseCase.execute({}, manager.user_id);
        const mgrDeptComp = await deptCompUseCase.execute({}, manager.user_id);
        assert(
            mgrDeptComp.length === 1 &&
            mgrDeptComp[0].allocatedBudget === mgrSummary.total_budget &&
            mgrDeptComp[0].totalApproved === mgrSummary.total_approved_expenses,
            `5.3 Manager scoping: Summary ($${mgrSummary.total_budget}) and Dept Comparison ($${mgrDeptComp[0].allocatedBudget}) report identical figures`,
        );

        // 5.4 RBAC enforcement: Employee blocked from Dept Comparison and Project Performance
        let empDeptBlocked = false;
        try {
            await deptCompUseCase.execute({}, employee.user_id);
        } catch (e) {
            if (e instanceof ForbiddenException) empDeptBlocked = true;
        }

        let empProjBlocked = false;
        try {
            await projPerfUseCase.execute({}, employee.user_id);
        } catch (e) {
            if (e instanceof ForbiddenException) empProjBlocked = true;
        }

        assert(empDeptBlocked, '5.4a Employee rejected with ForbiddenException from Department Comparison');
        assert(empProjBlocked, '5.4b Employee rejected with ForbiddenException from Project Performance');

        logger.log('\n====================================================================');
        logger.log(`🎉 ALL ${passed} AUDIT TESTS PASSED SUCCESSFULLY! (0 FAILED)`);
        logger.log('====================================================================\n');
    } catch (err) {
        logger.error('Final Budget Analytics validation error:', err);
        process.exitCode = 1;
    } finally {
        await app.close();
    }
}

runFinalBudgetAnalyticsValidation();
