import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { User } from '../../users/schemas/users.schema';
import { Department } from '../../departments/schemas/departments.schema';
import { Project } from '../../projects/schemas/project.schema';
import { Budget } from '../../budgets/schemas/budget.schema';
import { Expense } from '../../expenses/schemas/expense.schema';
import { ExpenseCategory } from '../../expenses/schemas/expense-category.schema';
import { ExpenseAttachment } from '../../expenses/schemas/expense-attachment.schema';
import { Notification } from '../../notifications/schemas/notification.schema';
import { ActivityLog } from '../../activity-logs/schemas/activity-log.schema';
import { ActionType, EntityType, ExpenseStatus, UserRole } from '../../common/enums';
import {
    SEED_CATEGORIES,
    SEED_DEPARTMENTS,
    SEED_EMAIL_DOMAIN,
    SEED_MARKER,
    SEED_PROJECT_TAG,
    SEED_PROJECTS,
} from './constants/seed-data.constants';
import { generateSeedUsers } from './generators/user.generator';
import { generateSeedBudgets } from './generators/budget.generator';
import { generateSeedExpenses } from './generators/expense.generator';
import { generateSeedAttachments } from './generators/attachment.generator';
import { generateSeedNotifications } from './generators/notification.generator';
import { generateSeedActivityLogs } from './generators/activity-log.generator';

@Injectable()
export class SeederService {
    private readonly logger = new Logger(SeederService.name);

    constructor(private readonly dataSource: DataSource) {}

    async run(options: { reset?: boolean } = {}): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction('SERIALIZABLE');

        this.logger.log('Starting Seeder in SERIALIZABLE transaction...');

        try {
            if (options.reset) {
                this.logger.log('Reset requested: Running Pre-Reset Conflict Check...');
                await this.preResetConflictCheck(queryRunner);

                this.logger.log('Executing safe reset in reverse FK order...');
                await this.executeSafeReset(queryRunner);
            }

            this.logger.log('Executing batch seed...');
            await this.executeBatchSeed(queryRunner);

            this.logger.log('Executing post-seed data validation...');
            await this.executePostSeedValidation(queryRunner);

            await queryRunner.commitTransaction();
            this.logger.log('Seeder completed successfully. Transaction committed.');
        } catch (error) {
            this.logger.error('Seeder failed! Rolling back transaction...', error);
            if (queryRunner.isTransactionActive) {
                try {
                    await queryRunner.rollbackTransaction();
                    this.logger.warn('Transaction rolled back successfully.');
                } catch (rbError) {
                    this.logger.error('Rollback error:', rbError);
                }
            }
            throw error;
        } finally {
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
        }
    }

    /**
     * Pre-Reset Conflict Check
     * Uses NOT EXISTS / strict anti-joins to verify that NO non-seeded (real) record
     * references any seeded entity. If any dependency exists, ABORTS reset immediately.
     */
    private async preResetConflictCheck(queryRunner: QueryRunner): Promise<void> {
        // 1. Lock all relevant tables in SHARE ROW EXCLUSIVE MODE to prevent concurrent writes
        await queryRunner.query(`
            LOCK TABLE 
                activity_logs, 
                budgets, 
                departments, 
                expense_attachments, 
                expenses, 
                notifications, 
                projects, 
                refresh_tokens, 
                users 
            IN SHARE ROW EXCLUSIVE MODE;
        `);

        // Check 1: Real expense referencing seeded user as reviewer_id
        const conflictReviewer = await queryRunner.query(`
            SELECT expense_id FROM expenses e
            WHERE e.description NOT LIKE '%${SEED_MARKER}%'
              AND e.reviewer_id IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
            LIMIT 1;
        `);
        if (conflictReviewer.length > 0) {
            throw new Error(
                `Reset aborted: Real expense (ID: ${conflictReviewer[0].expense_id}) references a seeded user as reviewer_id.`,
            );
        }

        // Check 2: Real expense referencing seeded user as submitter (user_id)
        const conflictSubmitter = await queryRunner.query(`
            SELECT expense_id FROM expenses e
            WHERE e.description NOT LIKE '%${SEED_MARKER}%'
              AND e.user_id IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
            LIMIT 1;
        `);
        if (conflictSubmitter.length > 0) {
            throw new Error(
                `Reset aborted: Real expense (ID: ${conflictSubmitter[0].expense_id}) submitted by seeded user.`,
            );
        }

        // Check 3: Real department managed by seeded user
        const conflictManager = await queryRunner.query(`
            SELECT department_id FROM departments d
            WHERE d.description NOT LIKE '%${SEED_MARKER}%'
              AND d.manager_id IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
            LIMIT 1;
        `);
        if (conflictManager.length > 0) {
            throw new Error(
                `Reset aborted: Real department (ID: ${conflictManager[0].department_id}) is managed by a seeded user.`,
            );
        }

        // Check 4: Real budget created by seeded user
        const conflictBudgetCreator = await queryRunner.query(`
            SELECT budget_id FROM budgets b
            WHERE b.created_by IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
              AND (
                (b.department_id IS NOT NULL AND b.department_id NOT IN (SELECT department_id FROM departments WHERE description LIKE '%${SEED_MARKER}%'))
                OR
                (b.project_id IS NOT NULL AND b.project_id NOT IN (SELECT project_id FROM projects WHERE project_name LIKE '%${SEED_PROJECT_TAG}%'))
              )
            LIMIT 1;
        `);
        if (conflictBudgetCreator.length > 0) {
            throw new Error(
                `Reset aborted: Real budget (ID: ${conflictBudgetCreator[0].budget_id}) was created by a seeded user.`,
            );
        }

        // Check 5: Real notification referencing seeded expense (CASCADE protection!)
        const conflictNotification = await queryRunner.query(`
            SELECT notification_id FROM notifications n
            WHERE n.user_id NOT IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
              AND n.expense_id IN (SELECT expense_id FROM expenses WHERE description LIKE '%${SEED_MARKER}%')
            LIMIT 1;
        `);
        if (conflictNotification.length > 0) {
            throw new Error(
                `Reset aborted: Real user notification (ID: ${conflictNotification[0].notification_id}) references a seeded expense.`,
            );
        }

        // Check 6: Real expense charged to seeded department
        const conflictDeptExpense = await queryRunner.query(`
            SELECT expense_id FROM expenses e
            WHERE e.description NOT LIKE '%${SEED_MARKER}%'
              AND e.department_id IN (SELECT department_id FROM departments WHERE description LIKE '%${SEED_MARKER}%')
            LIMIT 1;
        `);
        if (conflictDeptExpense.length > 0) {
            throw new Error(
                `Reset aborted: Real expense (ID: ${conflictDeptExpense[0].expense_id}) belongs to seeded department.`,
            );
        }

        // Check 7: Real expense charged to seeded project
        const conflictProjectExpense = await queryRunner.query(`
            SELECT expense_id FROM expenses e
            WHERE e.description NOT LIKE '%${SEED_MARKER}%'
              AND e.project_id IS NOT NULL
              AND e.project_id IN (SELECT project_id FROM projects WHERE project_name LIKE '%${SEED_PROJECT_TAG}%')
            LIMIT 1;
        `);
        if (conflictProjectExpense.length > 0) {
            throw new Error(
                `Reset aborted: Real expense (ID: ${conflictProjectExpense[0].expense_id}) belongs to seeded project.`,
            );
        }

        // Check 8: Real user assigned to seeded department
        const conflictUserDept = await queryRunner.query(`
            SELECT user_id FROM users u
            WHERE u.email NOT LIKE '%${SEED_EMAIL_DOMAIN}'
              AND u.department_id IN (SELECT department_id FROM departments WHERE description LIKE '%${SEED_MARKER}%')
            LIMIT 1;
        `);
        if (conflictUserDept.length > 0) {
            throw new Error(
                `Reset aborted: Real user (ID: ${conflictUserDept[0].user_id}) is assigned to a seeded department.`,
            );
        }

        // Check 9: Real project assigned to seeded department
        const conflictRealProject = await queryRunner.query(`
            SELECT project_id FROM projects p
            WHERE p.project_name NOT LIKE '%${SEED_PROJECT_TAG}%'
              AND p.department_id IN (SELECT department_id FROM departments WHERE description LIKE '%${SEED_MARKER}%')
            LIMIT 1;
        `);
        if (conflictRealProject.length > 0) {
            throw new Error(
                `Reset aborted: Real project (ID: ${conflictRealProject[0].project_id}) belongs to a seeded department.`,
            );
        }

        // Check 10: Real budget assigned to seeded department or project
        const conflictRealBudget = await queryRunner.query(`
            SELECT budget_id FROM budgets b
            WHERE b.created_by NOT IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
              AND (
                (b.department_id IS NOT NULL AND b.department_id IN (SELECT department_id FROM departments WHERE description LIKE '%${SEED_MARKER}%'))
                OR
                (b.project_id IS NOT NULL AND b.project_id IN (SELECT project_id FROM projects WHERE project_name LIKE '%${SEED_PROJECT_TAG}%'))
              )
            LIMIT 1;
        `);
        if (conflictRealBudget.length > 0) {
            throw new Error(
                `Reset aborted: Real budget (ID: ${conflictRealBudget[0].budget_id}) belongs to seeded department or project.`,
            );
        }

        // Check 11: Real activity log referencing seeded entity
        const conflictActivityLog = await queryRunner.query(`
            SELECT log_id FROM activity_logs l
            WHERE l.user_id NOT IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
              AND l.user_id <> 1
              AND (
                (l.entity_type = 'department' AND l.entity_id IN (SELECT department_id FROM departments WHERE description LIKE '%${SEED_MARKER}%'))
                OR
                (l.entity_type = 'project' AND l.entity_id IN (SELECT project_id FROM projects WHERE project_name LIKE '%${SEED_PROJECT_TAG}%'))
                OR
                (l.entity_type = 'expense' AND l.entity_id IN (SELECT expense_id FROM expenses WHERE description LIKE '%${SEED_MARKER}%'))
                OR
                (l.entity_type = 'user' AND l.entity_id IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}'))
              )
            LIMIT 1;
        `);
        if (conflictActivityLog.length > 0) {
            throw new Error(
                `Reset aborted: Real user activity log (ID: ${conflictActivityLog[0].log_id}) references a seeded entity.`,
            );
        }

        this.logger.log('Pre-Reset Conflict Check passed with 0 conflicts.');
    }

    /**
     * Executes safe deletion in strict reverse foreign-key dependency order.
     */
    private async executeSafeReset(queryRunner: QueryRunner): Promise<void> {
        // 1. Delete Activity Logs for seeded entities or seeded users
        await queryRunner.query(`
            DELETE FROM activity_logs
            WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
               OR (
                   entity_type = 'user' AND entity_id IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
               )
               OR (
                   entity_type = 'department' AND entity_id IN (SELECT department_id FROM departments WHERE description LIKE '%${SEED_MARKER}%')
               )
               OR (
                   entity_type = 'project' AND entity_id IN (SELECT project_id FROM projects WHERE project_name LIKE '%${SEED_PROJECT_TAG}%')
               )
               OR (
                   entity_type = 'budget' AND entity_id IN (
                       SELECT budget_id FROM budgets WHERE created_by IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
                   )
               )
               OR (
                   entity_type = 'expense' AND entity_id IN (SELECT expense_id FROM expenses WHERE description LIKE '%${SEED_MARKER}%')
               );
        `);

        // 2. Delete Notifications for seeded expenses or seeded users
        await queryRunner.query(`
            DELETE FROM notifications
            WHERE expense_id IN (SELECT expense_id FROM expenses WHERE description LIKE '%${SEED_MARKER}%')
               OR user_id IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}');
        `);

        // 3. Delete Expense Attachments for seeded expenses
        await queryRunner.query(`
            DELETE FROM expense_attachments
            WHERE expense_id IN (SELECT expense_id FROM expenses WHERE description LIKE '%${SEED_MARKER}%')
               OR file_path LIKE '%/seed_%';
        `);

        // 4. Delete Refresh Tokens for seeded users
        await queryRunner.query(`
            DELETE FROM refresh_tokens
            WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}');
        `);

        // 5. Delete Expenses
        await queryRunner.query(`
            DELETE FROM expenses
            WHERE description LIKE '%${SEED_MARKER}%'
               OR user_id IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}');
        `);

        // 6. Delete Budgets
        await queryRunner.query(`
            DELETE FROM budgets
            WHERE created_by IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}')
               OR department_id IN (SELECT department_id FROM departments WHERE description LIKE '%${SEED_MARKER}%')
               OR project_id IN (SELECT project_id FROM projects WHERE project_name LIKE '%${SEED_PROJECT_TAG}%');
        `);

        // 7. Delete Projects
        await queryRunner.query(`
            DELETE FROM projects
            WHERE project_name LIKE '%${SEED_PROJECT_TAG}%'
               OR department_id IN (SELECT department_id FROM departments WHERE description LIKE '%${SEED_MARKER}%');
        `);

        // 8. Break circular FK: Set users.department_id = NULL for seeded users
        await queryRunner.query(`
            UPDATE users
            SET department_id = NULL
            WHERE email LIKE '%${SEED_EMAIL_DOMAIN}';
        `);

        // 9. Delete Departments
        await queryRunner.query(`
            DELETE FROM departments
            WHERE description LIKE '%${SEED_MARKER}%';
        `);

        // 10. Delete Users
        await queryRunner.query(`
            DELETE FROM users
            WHERE email LIKE '%${SEED_EMAIL_DOMAIN}';
        `);

        this.logger.log('Safe reset deletion completed successfully.');
    }

    /**
     * Executes the complete batch seeding process adhering to dependency ordering.
     */
    private async executeBatchSeed(queryRunner: QueryRunner): Promise<void> {
        // Step 0: Ensure Categories exist
        for (const catName of SEED_CATEGORIES) {
            await queryRunner.query(
                `INSERT INTO expense_categories (category_name) VALUES ($1) ON CONFLICT (category_name) DO NOTHING;`,
                [catName],
            );
        }
        const categories = await queryRunner.query(`SELECT category_id, category_name FROM expense_categories;`);
        const categoryIds = categories.map((c: any) => String(c.category_id));

        // Step 1: Insert 6 Department Managers with department_id = NULL (resolving circular dependency)
        const allSeedUsers = generateSeedUsers();
        const managerUsers = allSeedUsers.filter((u) => u.role === UserRole.MANAGER);
        const nonManagerUsers = allSeedUsers.filter((u) => u.role !== UserRole.MANAGER);

        const managerInsertValues = managerUsers.map((m) => [
            m.full_name,
            m.email,
            m.password_hash,
            m.role,
            null, // department_id = null initially
            m.is_active,
        ]);

        const insertedManagers: { user_id: string; email: string }[] = [];
        for (const row of managerInsertValues) {
            const res = await queryRunner.query(
                `INSERT INTO users (full_name, email, password_hash, role, department_id, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING user_id, email;`,
                row,
            );
            insertedManagers.push({ user_id: String(res[0].user_id), email: res[0].email });
        }

        const managerByDeptKey = new Map<string, string>();
        for (const m of managerUsers) {
            const found = insertedManagers.find((im) => im.email === m.email);
            if (found && m.departmentKey) {
                managerByDeptKey.set(m.departmentKey, found.user_id);
            }
        }

        // Step 2: Insert 6 Departments
        const insertedDepartments: { department_id: string; key: string; manager_id: string }[] = [];
        for (const deptDef of SEED_DEPARTMENTS) {
            const managerId = managerByDeptKey.get(deptDef.key)!;
            const res = await queryRunner.query(
                `INSERT INTO departments (department_name, description, manager_id)
                 VALUES ($1, $2, $3)
                 RETURNING department_id;`,
                [deptDef.name, deptDef.description, managerId],
            );
            insertedDepartments.push({
                department_id: String(res[0].department_id),
                key: deptDef.key,
                manager_id: managerId,
            });
        }

        const deptIdByKey = new Map<string, string>();
        for (const d of insertedDepartments) {
            deptIdByKey.set(d.key, d.department_id);
        }

        // Step 3: Update 6 Managers with their actual department_id
        for (const d of insertedDepartments) {
            await queryRunner.query(
                `UPDATE users SET department_id = $1 WHERE user_id = $2;`,
                [d.department_id, d.manager_id],
            );
        }

        // Step 4: Insert the remaining 29 Users
        const insertedOtherUsers: { user_id: string; email: string; role: string; department_id: string | null }[] = [];
        for (const u of nonManagerUsers) {
            const deptId = u.departmentKey ? deptIdByKey.get(u.departmentKey) || null : null;
            const res = await queryRunner.query(
                `INSERT INTO users (full_name, email, password_hash, role, department_id, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING user_id, email, role;`,
                [u.full_name, u.email, u.password_hash, u.role, deptId, u.is_active],
            );
            insertedOtherUsers.push({
                user_id: String(res[0].user_id),
                email: res[0].email,
                role: res[0].role,
                department_id: deptId,
            });
        }

        // Collect all seeded users
        const allUsersList = [
            ...insertedManagers.map((m) => {
                const def = managerUsers.find((mu) => mu.email === m.email)!;
                return {
                    user_id: m.user_id,
                    email: m.email,
                    role: UserRole.MANAGER,
                    department_id: deptIdByKey.get(def.departmentKey!)!,
                };
            }),
            ...insertedOtherUsers,
        ];

        // Identify finance officer ID for creating budgets
        const financeOfficer = allUsersList.find((u) => u.role === UserRole.FINANCE_OFFICER);
        const financeOfficerId = financeOfficer ? financeOfficer.user_id : allUsersList[0].user_id;

        // Step 5: Insert 18 Projects
        const insertedProjects: { project_id: string; department_id: string; departmentKey: string; projectName: string; startDate: string; endDate: string }[] = [];
        for (const p of SEED_PROJECTS) {
            const deptId = deptIdByKey.get(p.departmentKey)!;
            const res = await queryRunner.query(
                `INSERT INTO projects (project_name, department_id, start_date, end_date, status)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING project_id;`,
                [p.projectName, deptId, p.startDate, p.endDate, p.status],
            );
            insertedProjects.push({
                project_id: String(res[0].project_id),
                department_id: deptId,
                departmentKey: p.departmentKey,
                projectName: p.projectName,
                startDate: p.startDate,
                endDate: p.endDate,
            });
        }

        // Map projects to departments
        const projectsByDeptId = new Map<string, string[]>();
        for (const p of insertedProjects) {
            const list = projectsByDeptId.get(p.department_id) || [];
            list.push(p.project_id);
            projectsByDeptId.set(p.department_id, list);
        }

        // Step 6: Insert 54 Budgets (18 department OpEx + 36 project CapEx)
        const budgetDefs = generateSeedBudgets(
            insertedDepartments.map((d) => ({ department_id: d.department_id, key: d.key })),
            insertedProjects,
            financeOfficerId,
        );

        const insertedBudgets: { budget_id: string }[] = [];
        for (const b of budgetDefs) {
            const res = await queryRunner.query(
                `INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING budget_id;`,
                [b.department_id, b.project_id, b.allocated_amount, b.start_date, b.end_date, b.created_by],
            );
            insertedBudgets.push({ budget_id: String(res[0].budget_id) });
        }

        // Step 7: Insert 2,800 Expenses in batches of 250
        const deptContexts = insertedDepartments.map((d) => ({
            department_id: d.department_id,
            key: d.key,
            manager_id: d.manager_id,
            projectIds: projectsByDeptId.get(d.department_id) || [],
        }));

        const employeeContexts = allUsersList
            .filter((u) => u.role === UserRole.EMPLOYEE)
            .map((u) => ({
                user_id: u.user_id,
                department_id: u.department_id!,
                role: u.role,
            }));

        const rawExpenses = generateSeedExpenses(deptContexts, employeeContexts, categoryIds);
        const insertedExpenses: {
            expense_id: string;
            user_id: string;
            status: ExpenseStatus;
            reviewer_id: string | null;
            submitted_at: Date;
            reviewed_at: Date | null;
        }[] = [];

        const BATCH_SIZE = 250;
        for (let i = 0; i < rawExpenses.length; i += BATCH_SIZE) {
            const chunk = rawExpenses.slice(i, i + BATCH_SIZE);
            const valueClauses: string[] = [];
            const params: any[] = [];
            let paramIdx = 1;

            for (const exp of chunk) {
                valueClauses.push(
                    `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
                );
                params.push(
                    exp.user_id,
                    exp.department_id,
                    exp.project_id,
                    exp.category_id,
                    exp.amount,
                    exp.description,
                    exp.expense_date,
                    exp.status,
                    exp.reviewer_id,
                    exp.review_comment,
                    exp.submitted_at,
                    exp.reviewed_at,
                );
            }

            const sql = `
                INSERT INTO expenses (
                    user_id, department_id, project_id, category_id, amount,
                    description, expense_date, status, reviewer_id, review_comment,
                    submitted_at, reviewed_at
                )
                VALUES ${valueClauses.join(', ')}
                RETURNING expense_id, user_id, status, reviewer_id, submitted_at, reviewed_at;
            `;

            const res = await queryRunner.query(sql, params);
            for (const r of res) {
                insertedExpenses.push({
                    expense_id: String(r.expense_id),
                    user_id: String(r.user_id),
                    status: r.status as ExpenseStatus,
                    reviewer_id: r.reviewer_id ? String(r.reviewer_id) : null,
                    submitted_at: new Date(r.submitted_at),
                    reviewed_at: r.reviewed_at ? new Date(r.reviewed_at) : null,
                });
            }
        }

        // Step 8: Insert ~1,600 Attachments in batches of 250
        const allExpenseIds = insertedExpenses.map((e) => e.expense_id);
        const rawAttachments = generateSeedAttachments(allExpenseIds);

        for (let i = 0; i < rawAttachments.length; i += BATCH_SIZE) {
            const chunk = rawAttachments.slice(i, i + BATCH_SIZE);
            const valueClauses: string[] = [];
            const params: any[] = [];
            let paramIdx = 1;

            for (const att of chunk) {
                valueClauses.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
                params.push(
                    att.expense_id,
                    att.file_name,
                    att.file_path,
                    att.content_type,
                    att.file_size_bytes,
                    att.uploaded_at,
                );
            }

            const sql = `
                INSERT INTO expense_attachments (
                    expense_id, file_name, file_path, content_type, file_size_bytes, uploaded_at
                )
                VALUES ${valueClauses.join(', ')};
            `;
            await queryRunner.query(sql, params);
        }

        // Step 9: Insert 2,380 Notifications in batches of 250
        const reviewedExpenses = insertedExpenses.filter((e) => e.status !== ExpenseStatus.PENDING);
        const rawNotifications = generateSeedNotifications(reviewedExpenses);

        for (let i = 0; i < rawNotifications.length; i += BATCH_SIZE) {
            const chunk = rawNotifications.slice(i, i + BATCH_SIZE);
            const valueClauses: string[] = [];
            const params: any[] = [];
            let paramIdx = 1;

            for (const n of chunk) {
                valueClauses.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
                params.push(
                    n.user_id,
                    n.type,
                    n.expense_id,
                    n.title,
                    n.body,
                    n.is_read,
                    n.created_at,
                    n.read_at,
                );
            }

            const sql = `
                INSERT INTO notifications (
                    user_id, type, expense_id, title, body, is_read, created_at, read_at
                )
                VALUES ${valueClauses.join(', ')};
            `;
            await queryRunner.query(sql, params);
        }

        // Step 10: Insert Activity Logs in batches of 250
        // Query system_admin ID
        const adminRes = await queryRunner.query(`SELECT admin_id FROM system_admins LIMIT 1;`);
        const systemAdminId = adminRes.length > 0 ? String(adminRes[0].admin_id) : '1';

        const rawActivityLogs = generateSeedActivityLogs({
            systemAdminId,
            financeOfficerId,
            userIds: allUsersList.map((u) => u.user_id),
            departmentIds: insertedDepartments.map((d) => d.department_id),
            projectIds: insertedProjects.map((p) => p.project_id),
            budgetIds: insertedBudgets.map((b) => b.budget_id),
            expenses: insertedExpenses,
        });

        for (let i = 0; i < rawActivityLogs.length; i += BATCH_SIZE) {
            const chunk = rawActivityLogs.slice(i, i + BATCH_SIZE);
            const valueClauses: string[] = [];
            const params: any[] = [];
            let paramIdx = 1;

            for (const log of chunk) {
                valueClauses.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
                params.push(
                    log.user_id,
                    log.action_type,
                    log.entity_type,
                    log.entity_id,
                    log.created_at,
                );
            }

            const sql = `
                INSERT INTO activity_logs (
                    user_id, action_type, entity_type, entity_id, created_at
                )
                VALUES ${valueClauses.join(', ')};
            `;
            await queryRunner.query(sql, params);
        }

        this.logger.log(`Batch seeding completed. Inserted 34 users, 6 departments, 18 projects, 54 budgets, 2,800 expenses, ${rawAttachments.length} attachments, ${rawNotifications.length} notifications, ${rawActivityLogs.length} activity logs.`);
    }

    /**
     * Post-seed validation: Verifies record counts and database CHECK constraints.
     */
    private async executePostSeedValidation(queryRunner: QueryRunner): Promise<void> {
        // 1. Validate Users count
        const usersCountRes = await queryRunner.query(
            `SELECT count(*) FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}';`,
        );
        const usersCount = parseInt(usersCountRes[0].count, 10);
        if (usersCount !== 34) {
            throw new Error(`Validation failed: Expected 34 seeded users, got ${usersCount}`);
        }

        // 2. Validate Departments count
        const deptsCountRes = await queryRunner.query(
            `SELECT count(*) FROM departments WHERE description LIKE '%${SEED_MARKER}%';`,
        );
        const deptsCount = parseInt(deptsCountRes[0].count, 10);
        if (deptsCount !== 6) {
            throw new Error(`Validation failed: Expected 6 seeded departments, got ${deptsCount}`);
        }

        // 3. Validate Projects count
        const projsCountRes = await queryRunner.query(
            `SELECT count(*) FROM projects WHERE project_name LIKE '%${SEED_PROJECT_TAG}%';`,
        );
        const projsCount = parseInt(projsCountRes[0].count, 10);
        if (projsCount !== 18) {
            throw new Error(`Validation failed: Expected 18 seeded projects, got ${projsCount}`);
        }

        // 4. Validate Budgets count
        const budgetsCountRes = await queryRunner.query(
            `SELECT count(*) FROM budgets WHERE created_by IN (SELECT user_id FROM users WHERE email LIKE '%${SEED_EMAIL_DOMAIN}');`,
        );
        const budgetsCount = parseInt(budgetsCountRes[0].count, 10);
        if (budgetsCount !== 54) {
            throw new Error(`Validation failed: Expected 54 seeded budgets, got ${budgetsCount}`);
        }

        // 5. Validate Expenses count
        const expensesCountRes = await queryRunner.query(
            `SELECT count(*) FROM expenses WHERE description LIKE '%${SEED_MARKER}%';`,
        );
        const expensesCount = parseInt(expensesCountRes[0].count, 10);
        if (expensesCount !== 2800) {
            throw new Error(`Validation failed: Expected 2800 seeded expenses, got ${expensesCount}`);
        }

        // 6. Validate Expense Status distribution
        const approvedCountRes = await queryRunner.query(
            `SELECT count(*) FROM expenses WHERE description LIKE '%${SEED_MARKER}%' AND status = 'approved';`,
        );
        const rejectedCountRes = await queryRunner.query(
            `SELECT count(*) FROM expenses WHERE description LIKE '%${SEED_MARKER}%' AND status = 'rejected';`,
        );
        const pendingCountRes = await queryRunner.query(
            `SELECT count(*) FROM expenses WHERE description LIKE '%${SEED_MARKER}%' AND status = 'pending';`,
        );
        const approvedCount = parseInt(approvedCountRes[0].count, 10);
        const rejectedCount = parseInt(rejectedCountRes[0].count, 10);
        const pendingCount = parseInt(pendingCountRes[0].count, 10);

        if (approvedCount !== 1960 || rejectedCount !== 420 || pendingCount !== 420) {
            throw new Error(
                `Validation failed: Unexpected status distribution. Approved: ${approvedCount} (expected 1960), Rejected: ${rejectedCount} (expected 420), Pending: ${pendingCount} (expected 420)`,
            );
        }

        // 7. Verify CHECK constraint compliance directly
        const invalidPending = await queryRunner.query(`
            SELECT expense_id FROM expenses
            WHERE description LIKE '%${SEED_MARKER}%'
              AND status = 'pending'
              AND (reviewer_id IS NOT NULL OR reviewed_at IS NOT NULL OR review_comment IS NOT NULL);
        `);
        if (invalidPending.length > 0) {
            throw new Error(`Validation failed: Found pending expenses violating CHECK constraint!`);
        }

        const invalidReviewed = await queryRunner.query(`
            SELECT expense_id FROM expenses
            WHERE description LIKE '%${SEED_MARKER}%'
              AND status IN ('approved', 'rejected')
              AND (reviewer_id IS NULL OR reviewed_at IS NULL);
        `);
        if (invalidReviewed.length > 0) {
            throw new Error(`Validation failed: Found reviewed expenses with missing reviewer metadata!`);
        }

        const invalidRejected = await queryRunner.query(`
            SELECT expense_id FROM expenses
            WHERE description LIKE '%${SEED_MARKER}%'
              AND status = 'rejected'
              AND (review_comment IS NULL OR TRIM(review_comment) = '');
        `);
        if (invalidRejected.length > 0) {
            throw new Error(`Validation failed: Found rejected expenses without mandatory review comment!`);
        }

        this.logger.log('Post-seed validation passed all integrity checks.');
    }
}
