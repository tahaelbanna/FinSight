import { ExpenseStatus } from '../../../common/enums';
import { SEED_MARKER } from '../constants/seed-data.constants';

export interface SeedExpenseRaw {
    user_id: string;
    department_id: string;
    project_id: string | null;
    category_id: string;
    amount: number;
    description: string;
    expense_date: string;
    status: ExpenseStatus;
    reviewer_id: string | null;
    review_comment: string | null;
    submitted_at: Date;
    reviewed_at: Date | null;
}

export interface UserContext {
    user_id: string;
    department_id: string;
    role: string;
}

export interface DepartmentContext {
    department_id: string;
    key: string;
    manager_id: string;
    projectIds: string[];
}

export function generateSeedExpenses(
    departments: DepartmentContext[],
    employees: UserContext[],
    categoryIds: string[],
): SeedExpenseRaw[] {
    const TOTAL_EXPENSES = 2800;
    const APPROVED_COUNT = 1960; // 70%
    const REJECTED_COUNT = 420;  // 15%
    const PENDING_COUNT = 420;   // 15%

    // Create status array with exact distribution
    const statuses: ExpenseStatus[] = [];
    for (let i = 0; i < APPROVED_COUNT; i++) statuses.push(ExpenseStatus.APPROVED);
    for (let i = 0; i < REJECTED_COUNT; i++) statuses.push(ExpenseStatus.REJECTED);
    for (let i = 0; i < PENDING_COUNT; i++) statuses.push(ExpenseStatus.PENDING);

    // Group employees by department
    const employeesByDept = new Map<string, UserContext[]>();
    for (const emp of employees) {
        if (!emp.department_id) continue;
        const list = employeesByDept.get(emp.department_id) || [];
        list.push(emp);
        employeesByDept.set(emp.department_id, list);
    }

    const expenses: SeedExpenseRaw[] = [];

    // Realistic expense description templates
    const descriptions = [
        'Quarterly Cloud Hosting & Reserved Instances Invoice',
        'Team Offsite Strategy Session & Catering',
        'Enterprise Security & Penetration Testing Retainer',
        'Hardware Upgrades: High-Performance Developer Laptops',
        'Client Business Dinner & Strategy Meeting',
        'Flight, Lodging & Transportation for Global Summit',
        'Annual SaaS Developer Tools & IDE Enterprise Subscriptions',
        'Office Ergonomic Chairs & Monitor Arms',
        'Digital Ad Campaign Media Placement & Sponsored Search',
        'Executive Legal Advisory Services & Contract Review',
        'Internal Staff Training & Leadership Workshop',
        'Conference Booth Registration & Exhibition Materials',
    ];

    // Time ranges: 2024 (900), 2025 (1200), 2026 (700)
    const baseDateStart2024 = new Date('2024-01-15T09:00:00Z').getTime();
    const baseDateEnd2024 = new Date('2024-12-20T17:00:00Z').getTime();

    const baseDateStart2025 = new Date('2025-01-10T09:00:00Z').getTime();
    const baseDateEnd2025 = new Date('2025-12-20T17:00:00Z').getTime();

    const baseDateStart2026 = new Date('2026-01-05T09:00:00Z').getTime();
    const baseDateEnd2026 = new Date('2026-10-15T17:00:00Z').getTime();

    for (let i = 0; i < TOTAL_EXPENSES; i++) {
        // Select department in round-robin fashion
        const dept = departments[i % departments.length];
        const deptEmployees = employeesByDept.get(dept.department_id) || [];
        const submitter = deptEmployees.length > 0
            ? deptEmployees[i % deptEmployees.length]
            : { user_id: dept.manager_id, department_id: dept.department_id, role: 'manager' };

        // 50% project-level (CapEx), 50% department-level (OpEx)
        let projectId: string | null = null;
        if (i % 2 === 1 && dept.projectIds.length > 0) {
            projectId = dept.projectIds[i % dept.projectIds.length];
        }

        // Category
        const categoryId = categoryIds[i % categoryIds.length];

        // Determine date by index:
        // 0 - 899: 2024
        // 900 - 2099: 2025
        // 2100 - 2799: 2026
        let expTimeMs: number;
        if (i < 900) {
            const frac = i / 900;
            expTimeMs = baseDateStart2024 + frac * (baseDateEnd2024 - baseDateStart2024);
        } else if (i < 2100) {
            const frac = (i - 900) / 1200;
            expTimeMs = baseDateStart2025 + frac * (baseDateEnd2025 - baseDateStart2025);
        } else {
            const frac = (i - 2100) / 700;
            expTimeMs = baseDateStart2026 + frac * (baseDateEnd2026 - baseDateStart2026);
        }

        const expDate = new Date(expTimeMs);
        const expDateStr = expDate.toISOString().split('T')[0];

        // Realistic Amount: from $45 to $7500
        const baseAmount = 45.0 + ((i * 37) % 6500) + ((i % 10) * 12.5);
        const amount = Math.round(baseAmount * 100) / 100;

        const status = statuses[i];
        const submittedAt = new Date(expTimeMs + 1000 * 60 * 30); // 30 mins after expense date

        let reviewerId: string | null = null;
        let reviewedAt: Date | null = null;
        let reviewComment: string | null = null;

        if (status === ExpenseStatus.APPROVED) {
            reviewerId = dept.manager_id;
            reviewedAt = new Date(submittedAt.getTime() + 1000 * 60 * 60 * (12 + (i % 48)));
            reviewComment = 'Approved per departmental budget policy.';
        } else if (status === ExpenseStatus.REJECTED) {
            reviewerId = dept.manager_id;
            reviewedAt = new Date(submittedAt.getTime() + 1000 * 60 * 60 * (6 + (i % 36)));
            reviewComment = `Rejected: Itemized documentation exceeds policy allocation limit. ${SEED_MARKER}`;
        } else {
            // PENDING: must have nulls for all three to satisfy CHECK constraint!
            reviewerId = null;
            reviewedAt = null;
            reviewComment = null;
        }

        const descTemplate = descriptions[i % descriptions.length];
        const description = `${descTemplate} #${i + 1} ${SEED_MARKER}`;

        expenses.push({
            user_id: submitter.user_id,
            department_id: dept.department_id,
            project_id: projectId,
            category_id: categoryId,
            amount,
            description,
            expense_date: expDateStr,
            status,
            reviewer_id: reviewerId,
            review_comment: reviewComment,
            submitted_at: submittedAt,
            reviewed_at: reviewedAt,
        });
    }

    return expenses;
}
