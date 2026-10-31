import * as bcrypt from 'bcrypt';
import { UserRole } from '../../../common/enums';
import { SEED_DEPARTMENTS, SEED_EMAIL_DOMAIN } from '../constants/seed-data.constants';

export interface SeedUserRaw {
    full_name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    departmentKey: string | null;
    is_active: boolean;
}

// Pre-computed bcrypt hash for 'Password123!' with 10 salt rounds
// This guarantees fast deterministic seeding without spending 35 seconds rehashing
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);

export function generateSeedUsers(): SeedUserRaw[] {
    const users: SeedUserRaw[] = [];

    // 1. 6 Department Managers
    for (const dept of SEED_DEPARTMENTS) {
        users.push({
            full_name: dept.managerName,
            email: dept.managerEmail,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.MANAGER,
            departmentKey: dept.key,
            is_active: true,
        });
    }

    // 2. 3 Finance Officers
    users.push(
        {
            full_name: 'Marcus Vance (Finance Officer)',
            email: `marcus.vance${SEED_EMAIL_DOMAIN}`,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.FINANCE_OFFICER,
            departmentKey: 'finance',
            is_active: true,
        },
        {
            full_name: 'Jessica Thorne (Finance Officer)',
            email: `jessica.thorne${SEED_EMAIL_DOMAIN}`,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.FINANCE_OFFICER,
            departmentKey: 'finance',
            is_active: true,
        },
        {
            full_name: 'Oliver Queen (Finance Officer)',
            email: `oliver.queen${SEED_EMAIL_DOMAIN}`,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.FINANCE_OFFICER,
            departmentKey: 'finance',
            is_active: true,
        },
    );



    // 4. 25 Employees across departments
    // Engineering: 6
    const engEmployees = [
        'Alex Mercer',
        'Liam Henderson',
        'Zoe Saldana',
        'Vikram Patel',
        'Chen Wei',
        'Maya Lin',
    ];
    for (let i = 0; i < engEmployees.length; i++) {
        users.push({
            full_name: `${engEmployees[i]} (Eng)`,
            email: `emp.eng.${i + 1}${SEED_EMAIL_DOMAIN}`,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.EMPLOYEE,
            departmentKey: 'engineering',
            is_active: i !== 5, // 1 inactive (Maya Lin)
        });
    }

    // Product: 4
    const prodEmployees = [
        'Hannah Abbott',
        'Cedric Diggory',
        'Cho Chang',
        'Dean Thomas',
    ];
    for (let i = 0; i < prodEmployees.length; i++) {
        users.push({
            full_name: `${prodEmployees[i]} (Prod)`,
            email: `emp.prod.${i + 1}${SEED_EMAIL_DOMAIN}`,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.EMPLOYEE,
            departmentKey: 'product',
            is_active: true,
        });
    }

    // Marketing: 4
    const mktgEmployees = [
        'Lucas Scott',
        'Brooke Davis',
        'Peyton Sawyer',
        'Nathan Scott',
    ];
    for (let i = 0; i < mktgEmployees.length; i++) {
        users.push({
            full_name: `${mktgEmployees[i]} (Mktg)`,
            email: `emp.mktg.${i + 1}${SEED_EMAIL_DOMAIN}`,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.EMPLOYEE,
            departmentKey: 'marketing',
            is_active: i !== 3, // 1 inactive (Nathan Scott)
        });
    }

    // Sales: 4
    const salesEmployees = [
        'Harvey Specter',
        'Mike Ross',
        'Donna Paulsen',
        'Rachel Zane',
    ];
    for (let i = 0; i < salesEmployees.length; i++) {
        users.push({
            full_name: `${salesEmployees[i]} (Sales)`,
            email: `emp.sales.${i + 1}${SEED_EMAIL_DOMAIN}`,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.EMPLOYEE,
            departmentKey: 'sales',
            is_active: true,
        });
    }

    // HR: 3
    const hrEmployees = ['Toby Flenderson', 'Pam Beesly', 'Erin Hannon'];
    for (let i = 0; i < hrEmployees.length; i++) {
        users.push({
            full_name: `${hrEmployees[i]} (HR)`,
            email: `emp.hr.${i + 1}${SEED_EMAIL_DOMAIN}`,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.EMPLOYEE,
            departmentKey: 'hr',
            is_active: i !== 0, // 1 inactive (Toby Flenderson)
        });
    }

    // Finance: 4
    const finEmployees = [
        'Oscar Martinez',
        'Kevin Malone',
        'Angela Martin',
        'Ben Wyatt',
    ];
    for (let i = 0; i < finEmployees.length; i++) {
        users.push({
            full_name: `${finEmployees[i]} (Fin)`,
            email: `emp.fin.${i + 1}${SEED_EMAIL_DOMAIN}`,
            password_hash: DEFAULT_PASSWORD_HASH,
            role: UserRole.EMPLOYEE,
            departmentKey: 'finance',
            is_active: true,
        });
    }

    // Total = 6 managers + 3 finance + 6 eng + 4 prod + 4 mktg + 4 sales + 3 hr + 4 fin = 34 regular users!
    // Active = 31, Inactive = 3 (Maya Lin, Nathan Scott, Toby Flenderson)
    return users;
}
