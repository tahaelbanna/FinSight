import { ProjectStatus, UserRole } from '../../../common/enums';

export const SEED_MARKER = '[FINSIGHT_SEED_DATA]';
export const SEED_PROJECT_TAG = '[SEED]';
export const SEED_EMAIL_DOMAIN = '@seed.finsight.internal';

export interface SeedDepartmentDef {
    key: string;
    name: string;
    description: string;
    managerEmail: string;
    managerName: string;
}

export const SEED_DEPARTMENTS: SeedDepartmentDef[] = [
    {
        key: 'engineering',
        name: 'Engineering (Seed)',
        description: 'Software Engineering, Infrastructure, and DevOps [FINSIGHT_SEED_DATA]',
        managerEmail: `manager.engineering${SEED_EMAIL_DOMAIN}`,
        managerName: 'Sarah Jenkins (Eng Mgr)',
    },
    {
        key: 'product',
        name: 'Product Management (Seed)',
        description: 'Product Discovery, Design, and Lifecycle Management [FINSIGHT_SEED_DATA]',
        managerEmail: `manager.product${SEED_EMAIL_DOMAIN}`,
        managerName: 'David Chen (Prod Mgr)',
    },
    {
        key: 'marketing',
        name: 'Marketing (Seed)',
        description: 'Growth, Digital Marketing, and Brand Communications [FINSIGHT_SEED_DATA]',
        managerEmail: `manager.marketing${SEED_EMAIL_DOMAIN}`,
        managerName: 'Elena Rostova (Mktg Mgr)',
    },
    {
        key: 'sales',
        name: 'Sales (Seed)',
        description: 'Enterprise Sales, Account Management, and Partnerships [FINSIGHT_SEED_DATA]',
        managerEmail: `manager.sales${SEED_EMAIL_DOMAIN}`,
        managerName: 'Michael Sterling (Sales Mgr)',
    },
    {
        key: 'hr',
        name: 'Human Resources (Seed)',
        description: 'People Operations, Talent Acquisition, and Culture [FINSIGHT_SEED_DATA]',
        managerEmail: `manager.hr${SEED_EMAIL_DOMAIN}`,
        managerName: 'Amira Khalil (HR Mgr)',
    },
    {
        key: 'finance',
        name: 'Finance (Seed)',
        description: 'Corporate Finance, Accounting, and Tax Compliance [FINSIGHT_SEED_DATA]',
        managerEmail: `manager.finance${SEED_EMAIL_DOMAIN}`,
        managerName: 'Arthur Pendelton (Fin Mgr)',
    },
];

export interface SeedProjectDef {
    departmentKey: string;
    projectName: string;
    startDate: string;
    endDate: string;
    status: ProjectStatus;
}

export const SEED_PROJECTS: SeedProjectDef[] = [
    // Engineering (3 projects)
    {
        departmentKey: 'engineering',
        projectName: 'Cloud Migration & Modernization [SEED]',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        status: ProjectStatus.COMPLETED,
    },
    {
        departmentKey: 'engineering',
        projectName: 'API Gateway & Microservices V2 [SEED]',
        startDate: '2025-02-01',
        endDate: '2025-11-30',
        status: ProjectStatus.ACTIVE,
    },
    {
        departmentKey: 'engineering',
        projectName: 'AI Real-Time Anomaly Engine [SEED]',
        startDate: '2026-01-10',
        endDate: '2026-10-31',
        status: ProjectStatus.PLANNED,
    },

    // Product (3 projects)
    {
        departmentKey: 'product',
        projectName: 'Design System & UI Component Library [SEED]',
        startDate: '2024-03-01',
        endDate: '2024-09-30',
        status: ProjectStatus.COMPLETED,
    },
    {
        departmentKey: 'product',
        projectName: 'Mobile Banking App Experience [SEED]',
        startDate: '2025-01-15',
        endDate: '2025-12-15',
        status: ProjectStatus.ACTIVE,
    },
    {
        departmentKey: 'product',
        projectName: 'Customer Analytics Self-Service [SEED]',
        startDate: '2026-02-01',
        endDate: '2026-11-30',
        status: ProjectStatus.PLANNED,
    },

    // Marketing (3 projects)
    {
        departmentKey: 'marketing',
        projectName: 'Global Brand Relaunch 2024 [SEED]',
        startDate: '2024-02-01',
        endDate: '2024-08-31',
        status: ProjectStatus.COMPLETED,
    },
    {
        departmentKey: 'marketing',
        projectName: 'Omnichannel Growth & Lead Gen [SEED]',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: ProjectStatus.ACTIVE,
    },
    {
        departmentKey: 'marketing',
        projectName: 'EMEA Regional Conference Series [SEED]',
        startDate: '2026-03-01',
        endDate: '2026-09-30',
        status: ProjectStatus.PLANNED,
    },

    // Sales (3 projects)
    {
        departmentKey: 'sales',
        projectName: 'Enterprise Sales Enablement Hub [SEED]',
        startDate: '2024-04-01',
        endDate: '2024-11-30',
        status: ProjectStatus.COMPLETED,
    },
    {
        departmentKey: 'sales',
        projectName: 'Strategic Accounts Acceleration [SEED]',
        startDate: '2025-02-15',
        endDate: '2025-12-31',
        status: ProjectStatus.ACTIVE,
    },
    {
        departmentKey: 'sales',
        projectName: 'Global Channel Partner Ecosystem [SEED]',
        startDate: '2026-01-15',
        endDate: '2026-08-31',
        status: ProjectStatus.ON_HOLD,
    },

    // HR (3 projects)
    {
        departmentKey: 'hr',
        projectName: 'Global Onboarding Experience 2.0 [SEED]',
        startDate: '2024-01-10',
        endDate: '2024-07-31',
        status: ProjectStatus.COMPLETED,
    },
    {
        departmentKey: 'hr',
        projectName: 'Engineering Academy & Upskilling [SEED]',
        startDate: '2025-03-01',
        endDate: '2025-10-31',
        status: ProjectStatus.ACTIVE,
    },
    {
        departmentKey: 'hr',
        projectName: 'Hybrid Workplace Health & Culture [SEED]',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        status: ProjectStatus.PLANNED,
    },

    // Finance (3 projects)
    {
        departmentKey: 'finance',
        projectName: 'Automated Tax & Audit Compliance [SEED]',
        startDate: '2024-05-01',
        endDate: '2024-12-31',
        status: ProjectStatus.COMPLETED,
    },
    {
        departmentKey: 'finance',
        projectName: 'Cloud Cost & Spend Optimization [SEED]',
        startDate: '2025-01-01',
        endDate: '2025-11-30',
        status: ProjectStatus.ACTIVE,
    },
    {
        departmentKey: 'finance',
        projectName: 'Real-Time Financial Forecasting ERP [SEED]',
        startDate: '2026-02-01',
        endDate: '2026-12-31',
        status: ProjectStatus.PLANNED,
    },
];

export const SEED_CATEGORIES = [
    'Travel & Lodging',
    'Office Supplies & Equipment',
    'Software Licenses & Cloud Infra',
    'Professional & Legal Services',
    'Marketing, Events & Advertising',
    'Hardware & Maintenance',
];
