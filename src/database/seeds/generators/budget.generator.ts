export interface SeedBudgetRaw {
    department_id: string | null;
    project_id: string | null;
    allocated_amount: number;
    start_date: string;
    end_date: string;
    created_by: string;
}

export interface DepartmentInfo {
    department_id: string;
    key: string;
}

export interface ProjectInfo {
    project_id: string;
    department_id: string;
    departmentKey: string;
    projectName: string;
    startDate: string;
    endDate: string;
}

export function generateSeedBudgets(
    departments: DepartmentInfo[],
    projects: ProjectInfo[],
    financeOfficerId: string,
): SeedBudgetRaw[] {
    const budgets: SeedBudgetRaw[] = [];

    // Base annual OpEx budget tiers by department
    const deptAnnualBudgetMap: Record<string, number> = {
        engineering: 450000.0,
        product: 280000.0,
        marketing: 350000.0,
        sales: 320000.0,
        hr: 180000.0,
        finance: 220000.0,
    };

    // 1. 18 Department OpEx budgets (6 departments * 3 fiscal years: 2024, 2025, 2026)
    const years = [2024, 2025, 2026];
    for (const dept of departments) {
        const baseAmount = deptAnnualBudgetMap[dept.key] || 250000.0;
        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            // Slight annual growth
            const multiplier = 1 + i * 0.1;
            const amount = Math.round(baseAmount * multiplier * 100) / 100;

            budgets.push({
                department_id: dept.department_id,
                project_id: null,
                allocated_amount: amount,
                start_date: `${year}-01-01`,
                end_date: `${year}-12-31`,
                created_by: financeOfficerId,
            });
        }
    }

    // 2. 36 Project CapEx budgets (18 projects * 2 allocation phases)
    for (const proj of projects) {
        const pStart = new Date(proj.startDate);
        const pEnd = new Date(proj.endDate);
        const totalDuration = pEnd.getTime() - pStart.getTime();
        const midTime = new Date(pStart.getTime() + totalDuration / 2);

        const midDateStr = midTime.toISOString().split('T')[0];

        // Phase 1 Budget: from project start to midDate
        // Make sure midDate > startDate, else adjust
        let phase1End = midDateStr;
        if (phase1End <= proj.startDate) {
            const nextDay = new Date(pStart.getTime() + 86400000 * 30);
            phase1End = nextDay.toISOString().split('T')[0];
        }

        // Phase 2 Budget: from next day of phase 1 to project end
        const phase2StartDate = new Date(new Date(phase1End).getTime() + 86400000)
            .toISOString()
            .split('T')[0];
        let phase2End = proj.endDate;
        if (phase2End <= phase2StartDate) {
            const finalDay = new Date(new Date(phase2StartDate).getTime() + 86400000 * 30)
                .toISOString()
                .split('T')[0];
            phase2End = finalDay;
        }

        const phase1Amount = 60000.0 + (parseInt(proj.project_id, 10) % 7) * 8500.0;
        const phase2Amount = 45000.0 + (parseInt(proj.project_id, 10) % 5) * 11000.0;

        // Phase 1
        budgets.push({
            department_id: null,
            project_id: proj.project_id,
            allocated_amount: phase1Amount,
            start_date: proj.startDate,
            end_date: phase1End,
            created_by: financeOfficerId,
        });

        // Phase 2
        budgets.push({
            department_id: null,
            project_id: proj.project_id,
            allocated_amount: phase2Amount,
            start_date: phase2StartDate,
            end_date: phase2End,
            created_by: financeOfficerId,
        });
    }

    // Total = 18 department + 36 project = 54 budgets!
    return budgets;
}
