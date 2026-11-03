import process from 'node:process';
import { Pool, PoolClient } from 'pg';

export interface DbConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

export const TEST_DB_CONFIG: DbConfig = {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT) || 5432,
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres123',
    database: 'finsight_test_db',
};

export const PERF_DB_CONFIG: DbConfig = {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT) || 5432,
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres123',
    database: 'finsight_perf_db',
};

export const DEV_DB_CONFIG: DbConfig = {
    host: process.env.host || 'localhost',
    port: Number(process.env.db_port) || 5432,
    user: process.env.username || 'postgres',
    password: process.env.password || 'postgres123',
    database: 'finsight_db',
};

export function createPool(config: DbConfig): Pool {
    return new Pool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        max: 20,
        idleTimeoutMillis: 10000,
    });
}

/**
 * Asserts that the client or pool is STRICTLY connected to an isolated test or perf database,
 * and NEVER to finsight_db.
 */
export async function assertIsolatedDatabase(client: PoolClient | Pool, allowedDatabases = ['finsight_test_db', 'finsight_perf_db']) {
    const res = await client.query('SELECT current_database();');
    const currentDb = res.rows[0].current_database;
    if (!allowedDatabases.includes(currentDb)) {
        throw new Error(
            `CRITICAL SAFETY VIOLATION: Expected connection to isolated database (${allowedDatabases.join(', ')}), but connected to '${currentDb}'!`
        );
    }
    return currentDb;
}

/**
 * Resets all tables in finsight_test_db to an empty state.
 */
export async function cleanTestDb(pool: Pool) {
    await assertIsolatedDatabase(pool, ['finsight_test_db']);
    const client = await pool.connect();
    try {
        await client.query(`
            TRUNCATE TABLE 
                notifications, 
                activity_logs, 
                expense_attachments, 
                expenses, 
                budgets, 
                projects, 
                refresh_tokens, 
                users, 
                departments, 
                expense_categories, 
                system_admins 
            RESTART IDENTITY CASCADE;
        `);
    } finally {
        client.release();
    }
}

export interface IsolatedFixtureData {
    adminId: string;
    financeOfficerId: string;
    managerId: string;
    employeeId: string;
    departmentId: string;
    projectId: string;
    categoryId: string;
    opexBudgetId: string;
    capexBudgetId: string;
}

/**
 * Seeds a clean, deterministic minimal organization in finsight_test_db.
 */
export async function seedIsolatedFixture(pool: Pool): Promise<IsolatedFixtureData> {
    await assertIsolatedDatabase(pool, ['finsight_test_db']);
    const client = await pool.connect();
    try {
        const dummyHash = '$2b$10$VDNfZiMs2SKbeke8u81Qx.7XCdOA6VtWlPiyki21ODlIhgF8onxHu';

        // 1. System Admin
        const adminRes = await client.query(`
            INSERT INTO system_admins (name, email, password_hash)
            VALUES ('Test Admin', 'admin@test.finsight.internal', '${dummyHash}')
            RETURNING admin_id;
        `);
        const adminId = String(adminRes.rows[0].admin_id);

        // 2. Manager user (without dept first)
        const mgrRes = await client.query(`
            INSERT INTO users (full_name, email, password_hash, role, is_active)
            VALUES ('Engineering Manager', 'manager.eng@test.finsight.internal', '${dummyHash}', 'manager', true)
            RETURNING user_id;
        `);
        const managerId = String(mgrRes.rows[0].user_id);

        // 3. Department
        const deptRes = await client.query(`
            INSERT INTO departments (department_name, manager_id, description)
            VALUES ('Engineering Department', ${managerId}, 'Test Engineering Scope')
            RETURNING department_id;
        `);
        const departmentId = String(deptRes.rows[0].department_id);

        // Link manager to department
        await client.query(`UPDATE users SET department_id = ${departmentId} WHERE user_id = ${managerId};`);

        // 4. Finance Officer
        const foRes = await client.query(`
            INSERT INTO users (full_name, email, password_hash, role, is_active)
            VALUES ('Finance Officer', 'fo@test.finsight.internal', '${dummyHash}', 'finance_officer', true)
            RETURNING user_id;
        `);
        const financeOfficerId = String(foRes.rows[0].user_id);

        // 5. Employee
        const empRes = await client.query(`
            INSERT INTO users (full_name, email, password_hash, role, is_active, department_id)
            VALUES ('Dev Employee', 'dev@test.finsight.internal', '${dummyHash}', 'employee', true, ${departmentId})
            RETURNING user_id;
        `);
        const employeeId = String(empRes.rows[0].user_id);

        // 6. Project
        const projRes = await client.query(`
            INSERT INTO projects (project_name, department_id, status, start_date, end_date)
            VALUES ('Core Infrastructure', ${departmentId}, 'active', '2025-01-01', '2025-12-31')
            RETURNING project_id;
        `);
        const projectId = String(projRes.rows[0].project_id);

        // 7. Category
        const catRes = await client.query(`
            INSERT INTO expense_categories (category_name)
            VALUES ('Cloud Services')
            RETURNING category_id;
        `);
        const categoryId = String(catRes.rows[0].category_id);

        // 8. OpEx Budget (department_id IS NOT NULL, project_id IS NULL)
        const opexRes = await client.query(`
            INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
            VALUES (${departmentId}, NULL, 100000.00, '2025-01-01', '2025-12-31', ${financeOfficerId})
            RETURNING budget_id;
        `);
        const opexBudgetId = String(opexRes.rows[0].budget_id);

        // 9. CapEx Budget (department_id IS NULL, project_id IS NOT NULL)
        const capexRes = await client.query(`
            INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
            VALUES (NULL, ${projectId}, 50000.00, '2025-01-01', '2025-12-31', ${financeOfficerId})
            RETURNING budget_id;
        `);
        const capexBudgetId = String(capexRes.rows[0].budget_id);

        return {
            adminId,
            financeOfficerId,
            managerId,
            employeeId,
            departmentId,
            projectId,
            categoryId,
            opexBudgetId,
            capexBudgetId,
        };
    } finally {
        client.release();
    }
}
