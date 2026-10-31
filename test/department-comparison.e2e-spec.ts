import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { GetDepartmentComparisonUseCase } from '../src/analytics/usecases/get-department-comparison.usecase';
import { UserRepository } from '../src/users/repositories/users.repository';
import { DepartmentRepository } from '../src/departments/repositories/department.repository';
import { BudgetRepository } from '../src/budgets/repositories/budget.repository';
import { ExpenseRepository } from '../src/expenses/repositories/expense.repository';
import { UserRole } from '../src/common/enums';
import { ForbiddenException } from '../src/common/error-handling/custom-exceptions/forbidden.exception';

describe('Department Comparison Analytics & Budget Model B (Integration Test)', () => {
    let moduleRef: TestingModule;
    let useCase: GetDepartmentComparisonUseCase;
    let userRepo: UserRepository;
    let deptRepo: DepartmentRepository;
    let budgetRepo: BudgetRepository;
    let expenseRepo: ExpenseRepository;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        useCase = moduleRef.get(GetDepartmentComparisonUseCase);
        userRepo = moduleRef.get(UserRepository);
        deptRepo = moduleRef.get(DepartmentRepository);
        budgetRepo = moduleRef.get(BudgetRepository);
        expenseRepo = moduleRef.get(ExpenseRepository);
    });

    afterAll(async () => {
        await moduleRef.close();
    });

    it('Scenario 1: No date filters (All-Time)', async () => {
        // Query as an admin user
        const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
        expect(admin).toBeDefined();

        const results = await useCase.execute({}, admin!.user_id);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(6);

        for (const item of results) {
            expect(item.department).toBeDefined();
            expect(item.department.department_id).toBeDefined();
            expect(item.department.department_name).toBeDefined();
            expect((item as any).department_id).toBeUndefined();
            expect((item as any).department_name).toBeUndefined();
            expect((item as any).total).toBeUndefined();
            expect(typeof item.totalApproved).toBe('number');
            expect(typeof item.allocatedBudget).toBe('number');
            expect(item.allocatedBudget).toBeGreaterThan(0);
            expect(typeof item.utilizationPercentage).toBe('number');
            expect(typeof item.isOverrun).toBe('boolean');
        }
    });

    it('Scenario 2: Both date_from and date_to (Partial Fiscal Year 2025)', async () => {
        const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
        const results = await useCase.execute(
            { date_from: '2025-01-01', date_to: '2025-06-30' },
            admin!.user_id,
        );

        expect(results.length).toBe(6);
        for (const item of results) {
            expect(item.allocatedBudget).toBeGreaterThan(0);
            expect(item.totalApproved).toBeGreaterThanOrEqual(0);
            if (item.allocatedBudget > 0) {
                expect(item.utilizationPercentage).not.toBeNull();
            }
        }
    });

    it('Scenario 3: date_from only (Open-ended future)', async () => {
        const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
        const results = await useCase.execute(
            { date_from: '2025-01-01' },
            admin!.user_id,
        );

        expect(results.length).toBe(6);
        for (const item of results) {
            expect(item.allocatedBudget).toBeGreaterThan(0);
            expect(item.totalApproved).toBeGreaterThanOrEqual(0);
        }
    });

    it('Scenario 4: date_to only (Open-ended past)', async () => {
        const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
        const results = await useCase.execute(
            { date_to: '2024-12-31' },
            admin!.user_id,
        );

        expect(results.length).toBe(6);
        for (const item of results) {
            expect(item.allocatedBudget).toBeGreaterThan(0);
            expect(item.totalApproved).toBeGreaterThanOrEqual(0);
        }
    });

    it('RBAC Scoping: Manager only sees their own department', async () => {
        const manager = await userRepo.findOne({ where: { role: UserRole.MANAGER } });
        expect(manager).toBeDefined();

        const results = await useCase.execute({}, manager!.user_id);
        expect(results.length).toBe(1);
        expect(results[0].department.department_id).toBe(manager!.department_id);
    });

    it('RBAC Security: Employee is forbidden from accessing analytics', async () => {
        const employee = await userRepo.findOne({ where: { role: UserRole.EMPLOYEE } });
        expect(employee).toBeDefined();

        await expect(useCase.execute({}, employee!.user_id)).rejects.toThrow(
            ForbiddenException,
        );
    });

    it('Zero-budget edge case returns utilizationPercentage: null', async () => {
        const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
        // Future date window where no budget exists (e.g. 2035)
        const results = await useCase.execute(
            { date_from: '2035-01-01', date_to: '2035-12-31' },
            admin!.user_id,
        );

        expect(results.length).toBe(6);
        for (const item of results) {
            expect(item.allocatedBudget).toBe(0);
            expect(item.utilizationPercentage).toBeNull();
        }
    });
});
