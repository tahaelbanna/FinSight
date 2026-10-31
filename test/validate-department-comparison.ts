import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { GetDepartmentComparisonUseCase } from '../src/analytics/usecases/get-department-comparison.usecase';
import { UserRepository } from '../src/users/repositories/users.repository';
import { UserRole } from '../src/common/enums';
import { ForbiddenException } from '../src/common/error-handling/custom-exceptions/forbidden.exception';

async function runValidation() {
    const logger = new Logger('DepartmentComparisonValidator');
    logger.log('Starting Department Comparison Model B Validation...');

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['warn', 'error'],
    });

    try {
        const useCase = app.get(GetDepartmentComparisonUseCase);
        const userRepo = app.get(UserRepository);

        const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
        if (!admin) throw new Error('No admin user found!');

        const manager = await userRepo.findOne({ where: { role: UserRole.MANAGER } });
        if (!manager) throw new Error('No manager user found!');

        const employee = await userRepo.findOne({ where: { role: UserRole.EMPLOYEE } });
        if (!employee) throw new Error('No employee user found!');

        // 1. Scenario 1: No date filters (All-Time)
        logger.log('Testing Scenario 1: No date filters (All-Time)...');
        const res1 = await useCase.execute({}, admin.user_id);
        if (res1.length !== 6) throw new Error(`Scenario 1 failed: Expected 6 departments, got ${res1.length}`);
        for (const item of res1) {
            if (!item.department || !item.department.department_id) throw new Error('Missing nested department object');
            if (typeof item.totalApproved !== 'number' || item.totalApproved <= 0) throw new Error('Invalid totalApproved');
            if (typeof item.allocatedBudget !== 'number' || item.allocatedBudget <= 0) throw new Error('Invalid allocatedBudget');
            if (typeof item.utilizationPercentage !== 'number') throw new Error('Invalid utilizationPercentage');
            if (typeof item.isOverrun !== 'boolean') throw new Error('Invalid isOverrun');
            logger.log(`  Dept: ${item.department.department_name} | Budget: $${item.allocatedBudget} | Spent: $${item.totalApproved} | Util: ${item.utilizationPercentage}% | Overrun: ${item.isOverrun}`);
        }
        logger.log(' Scenario 1 Passed.');

        // 2. Scenario 2: Both date_from and date_to (H1 2025)
        logger.log('Testing Scenario 2: date_from and date_to (2025-01-01 to 2025-06-30)...');
        const res2 = await useCase.execute({ date_from: '2025-01-01', date_to: '2025-06-30' }, admin.user_id);
        if (res2.length !== 6) throw new Error(`Scenario 2 failed: Expected 6 departments, got ${res2.length}`);
        for (const item of res2) {
            if (item.allocatedBudget <= 0) throw new Error(`Scenario 2 failed: Budget for ${item.department.department_name} should be prorated > 0`);
            // Prorated budget for half year should be approximately half of annual budget
            const allTime = res1.find(d => d.department.department_id === item.department.department_id)!;
            if (item.allocatedBudget >= allTime.allocatedBudget) {
                throw new Error(`Scenario 2 failed: Prorated budget (${item.allocatedBudget}) should be strictly less than all-time budget (${allTime.allocatedBudget})`);
            }
            logger.log(`  Dept: ${item.department.department_name} | Prorated H1 Budget: $${item.allocatedBudget} | Spent: $${item.totalApproved} | Util: ${item.utilizationPercentage}%`);
        }
        logger.log(' Scenario 2 Passed.');

        // 3. Scenario 3: date_from only (2025-01-01 onwards)
        logger.log('Testing Scenario 3: date_from only (2025-01-01 onwards)...');
        const res3 = await useCase.execute({ date_from: '2025-01-01' }, admin.user_id);
        if (res3.length !== 6) throw new Error(`Scenario 3 failed: Expected 6 departments, got ${res3.length}`);
        for (const item of res3) {
            if (item.allocatedBudget <= 0) throw new Error(`Scenario 3 failed: Budget should be > 0`);
            logger.log(`  Dept: ${item.department.department_name} | Post-2025 Budget: $${item.allocatedBudget} | Spent: $${item.totalApproved}`);
        }
        logger.log(' Scenario 2 Passed.');

        // 4. Scenario 4: date_to only (up to 2024-12-31)
        logger.log('Testing Scenario 4: date_to only (up to 2024-12-31)...');
        const res4 = await useCase.execute({ date_to: '2024-12-31' }, admin.user_id);
        if (res4.length !== 6) throw new Error(`Scenario 4 failed: Expected 6 departments, got ${res4.length}`);
        for (const item of res4) {
            if (item.allocatedBudget <= 0) throw new Error(`Scenario 4 failed: Budget should be > 0`);
            logger.log(`  Dept: ${item.department.department_name} | 2024 Budget: $${item.allocatedBudget} | Spent: $${item.totalApproved}`);
        }
        logger.log(' Scenario 4 Passed.');

        // 5. RBAC Scoping: Manager only sees their own department
        logger.log('Testing RBAC: Manager scoping...');
        const resMgr = await useCase.execute({}, manager.user_id);
        if (resMgr.length !== 1) throw new Error(`Manager scoping failed: Expected 1 department, got ${resMgr.length}`);
        if (resMgr[0].department.department_id !== manager.department_id) {
            throw new Error(`Manager scoping failed: Returned dept ${resMgr[0].department.department_id} does not match manager dept ${manager.department_id}`);
        }
        logger.log(` Manager scoped to single department (${resMgr[0].department.department_name}) successfully.`);

        // 6. RBAC Security: Employee is rejected with ForbiddenException
        logger.log('Testing RBAC: Employee forbidden...');
        let employeeRejected = false;
        try {
            await useCase.execute({}, employee.user_id);
        } catch (err) {
            if (err instanceof ForbiddenException) {
                employeeRejected = true;
            }
        }
        if (!employeeRejected) throw new Error('Security test failed: Employee was not rejected with ForbiddenException');
        logger.log(' Employee access correctly rejected with ForbiddenException.');

        // 7. Zero-budget edge case: future date returns null utilizationPercentage
        logger.log('Testing Edge Case: Zero-budget future window (2035)...');
        const resZero = await useCase.execute({ date_from: '2035-01-01', date_to: '2035-12-31' }, admin.user_id);
        for (const item of resZero) {
            if (item.allocatedBudget !== 0) throw new Error(`Expected allocatedBudget 0, got ${item.allocatedBudget}`);
            if (item.utilizationPercentage !== null) throw new Error(`Expected utilizationPercentage null, got ${item.utilizationPercentage}`);
        }
        logger.log(' Zero-budget window correctly returns allocatedBudget = 0 and utilizationPercentage = null.');

        logger.log('ALL DEPARTMENT COMPARISON VALIDATION CHECKS PASSED SUCCESSFULLY!');
    } catch (error) {
        logger.error('Validation test failed:', error);
        process.exitCode = 1;
    } finally {
        await app.close();
    }
}

runValidation();
