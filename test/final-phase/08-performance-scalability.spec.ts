import { Pool } from 'pg';
import { createPool, PERF_DB_CONFIG, assertIsolatedDatabase } from './test-db.helper';

interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

export async function runPerformanceScalabilityTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const perfPool = createPool(PERF_DB_CONFIG);

    const assert = (id: string, description: string, condition: boolean, errorMsg?: string) => {
        if (!condition) {
            results.push({ id, description, passed: false, error: errorMsg || 'Assertion failed' });
            console.error(`❌ [FAIL] ${id}: ${description} - ${errorMsg || ''}`);
        } else {
            results.push({ id, description, passed: true });
            console.log(`✅ [PASS] ${id}: ${description}`);
        }
    };

    console.log('\n===============================================================');
    console.log('SUB-PHASE 8: PERFORMANCE & SCALABILITY TESTING (ISOLATED PERF DB)');
    console.log('===============================================================');

    try {
        await assertIsolatedDatabase(perfPool, ['finsight_perf_db']);

        // Clean perf DB tables
        await perfPool.query(`
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

        console.log('\n--- 8.1 Seeding Base Entities in finsight_perf_db ---');
        const dummyHash = '$2b$10$VDNfZiMs2SKbeke8u81Qx.7XCdOA6VtWlPiyki21ODlIhgF8onxHu';

        // 1. Seed 6 Departments and 6 Managers
        for (let d = 1; d <= 6; d++) {
            await perfPool.query(`
                INSERT INTO users (full_name, email, password_hash, role, is_active)
                VALUES ('Manager ${d}', 'mgr.${d}@perf.finsight.internal', '${dummyHash}', 'manager', true);
                INSERT INTO departments (department_name, manager_id, description)
                VALUES ('Department ${d}', ${d}, 'Performance Dept ${d}');
                UPDATE users SET department_id = ${d} WHERE user_id = ${d};
            `);
        }

        // 2. Seed 18 Projects (3 per department)
        for (let p = 1; p <= 18; p++) {
            const deptId = ((p - 1) % 6) + 1;
            await perfPool.query(`
                INSERT INTO projects (project_name, department_id, status, start_date, end_date)
                VALUES ('Project ${p}', ${deptId}, 'active', '2024-01-01', '2026-12-31');
            `);
        }

        // 3. Seed 6 Categories
        const categories = ['Hardware', 'Software', 'Travel', 'Offsite', 'Cloud Hosting', 'Consulting'];
        for (const cat of categories) {
            await perfPool.query(`INSERT INTO expense_categories (category_name) VALUES ('${cat}');`);
        }

        // 4. Seed 30 Employees
        for (let e = 7; e <= 36; e++) {
            const deptId = ((e - 7) % 6) + 1;
            await perfPool.query(`
                INSERT INTO users (full_name, email, password_hash, role, is_active, department_id)
                VALUES ('Employee ${e}', 'emp.${e}@perf.finsight.internal', '${dummyHash}', 'employee', true, ${deptId});
            `);
        }

        // 5. Seed 54 Budgets (18 OpEx + 36 CapEx)
        for (let d = 1; d <= 6; d++) {
            // OpEx budget
            await perfPool.query(`
                INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
                VALUES (${d}, NULL, 1000000.00, '2024-01-01', '2026-12-31', 1);
            `);
        }
        for (let p = 1; p <= 18; p++) {
            // CapEx budget
            await perfPool.query(`
                INSERT INTO budgets (department_id, project_id, allocated_amount, start_date, end_date, created_by)
                VALUES (NULL, ${p}, 300000.00, '2024-01-01', '2026-12-31', 1);
            `);
        }

        // --- 8.2 GENERATE 10,000 EXPENSES DATASET ---
        console.log('\n--- 8.2 Scale Tier 1: Generating 10,000 Synthetic Expenses ---');
        const startGen10k = Date.now();
        await perfPool.query(`
            INSERT INTO expenses (
                user_id, 
                department_id, 
                project_id, 
                category_id, 
                amount, 
                description, 
                expense_date, 
                status, 
                reviewer_id, 
                reviewed_at, 
                review_comment,
                submitted_at
            )
            SELECT 
                7 + (g % 30),
                1 + (g % 6),
                CASE WHEN (g % 2) = 0 THEN 1 + (g % 18) ELSE NULL END,
                1 + (g % 6),
                ROUND((50 + (g % 4500))::numeric + 0.50, 2),
                'Performance benchmark expense #' || g,
                ('2024-01-01'::date + (g % 730 || ' days')::interval)::date,
                CASE WHEN (g % 10) < 7 THEN 'approved'::expenses_status_enum
                     WHEN (g % 10) < 9 THEN 'pending'::expenses_status_enum
                     ELSE 'rejected'::expenses_status_enum END,
                CASE WHEN (g % 10) < 7 THEN 1 + (g % 6)
                     WHEN (g % 10) = 9 THEN 1 + (g % 6)
                     ELSE NULL END,
                CASE WHEN (g % 10) < 7 THEN NOW()
                     WHEN (g % 10) = 9 THEN NOW()
                     ELSE NULL END,
                CASE WHEN (g % 10) = 9 THEN 'Not within allowable budget limits'
                     ELSE NULL END,
                NOW()
            FROM generate_series(1, 10000) g;
        `);
        const durationGen10k = Date.now() - startGen10k;
        console.log(`Generated 10,000 expenses in ${durationGen10k}ms`);

        const count10kRes = await perfPool.query(`SELECT COUNT(*) FROM expenses;`);
        assert('8.1.1', `Scale Tier 1 (10,000 expenses) generated successfully: ${count10kRes.rows[0].count} rows`, 
            Number(count10kRes.rows[0].count) === 10000
        );

        // --- 8.3 EXPLAIN ANALYZE AT 10,000 ROWS ---
        console.log('\n--- 8.3 Query Execution Plans (EXPLAIN ANALYZE at 10,000 rows) ---');
        
        // 1. Model B Aggregation Query
        const explainAgg10k = await perfPool.query(`
            EXPLAIN ANALYZE
            SELECT 
                d.department_id,
                d.department_name,
                COALESCE(SUM(b.allocated_amount), 0) AS total_budget,
                COALESCE(opex.spent, 0) AS opex_spent,
                COALESCE(capex.spent, 0) AS capex_spent
            FROM departments d
            LEFT JOIN budgets b ON b.department_id = d.department_id
            LEFT JOIN (
                SELECT department_id, SUM(amount) AS spent 
                FROM expenses WHERE status = 'approved' AND project_id IS NULL 
                GROUP BY department_id
            ) opex ON opex.department_id = d.department_id
            LEFT JOIN (
                SELECT department_id, SUM(amount) AS spent 
                FROM expenses WHERE status = 'approved' AND project_id IS NOT NULL 
                GROUP BY department_id
            ) capex ON capex.department_id = d.department_id
            GROUP BY d.department_id, d.department_name, opex.spent, capex.spent;
        `);
        const plan10kText = explainAgg10k.rows.map(r => r['QUERY PLAN']).join('\n');
        const execTimeMatch10k = plan10kText.match(/Execution Time: ([\d.]+) ms/);
        const execTime10k = execTimeMatch10k ? parseFloat(execTimeMatch10k[1]) : 0;
        console.log(`Model B Department Comparison Execution Time (10k rows): ${execTime10k} ms`);
        assert('8.1.2', `Model B Department Aggregation executes sub-50ms at 10,000 rows (${execTime10k} ms)`, execTime10k < 50);

        // 2. Paginated Expenses Filter Query
        const explainPage10k = await perfPool.query(`
            EXPLAIN ANALYZE
            SELECT * FROM expenses 
            WHERE department_id = 1 AND status = 'approved'
            ORDER BY expense_date DESC 
            LIMIT 20 OFFSET 0;
        `);
        const planPage10kText = explainPage10k.rows.map(r => r['QUERY PLAN']).join('\n');
        const execTimeMatchPage10k = planPage10kText.match(/Execution Time: ([\d.]+) ms/);
        const execTimePage10k = execTimeMatchPage10k ? parseFloat(execTimeMatchPage10k[1]) : 0;
        console.log(`Paginated Expenses Filter Execution Time (10k rows): ${execTimePage10k} ms`);
        assert('8.1.3', `Paginated Expenses Filter executes sub-25ms at 10,000 rows (${execTimePage10k} ms)`, execTimePage10k < 25);

        // --- 8.4 SCALE TIER 2: GENERATE 100,000 EXPENSES ---
        console.log('\n--- 8.4 Scale Tier 2: Expanding Dataset to 100,000 Synthetic Expenses ---');
        const startGen100k = Date.now();
        await perfPool.query(`
            INSERT INTO expenses (
                user_id, 
                department_id, 
                project_id, 
                category_id, 
                amount, 
                description, 
                expense_date, 
                status, 
                reviewer_id, 
                reviewed_at, 
                review_comment,
                submitted_at
            )
            SELECT 
                7 + (g % 30),
                1 + (g % 6),
                CASE WHEN (g % 2) = 0 THEN 1 + (g % 18) ELSE NULL END,
                1 + (g % 6),
                ROUND((50 + (g % 4500))::numeric + 0.50, 2),
                'Performance benchmark expense #' || (10000 + g),
                ('2024-01-01'::date + (g % 730 || ' days')::interval)::date,
                CASE WHEN (g % 10) < 7 THEN 'approved'::expenses_status_enum
                     WHEN (g % 10) < 9 THEN 'pending'::expenses_status_enum
                     ELSE 'rejected'::expenses_status_enum END,
                CASE WHEN (g % 10) < 7 THEN 1 + (g % 6)
                     WHEN (g % 10) = 9 THEN 1 + (g % 6)
                     ELSE NULL END,
                CASE WHEN (g % 10) < 7 THEN NOW()
                     WHEN (g % 10) = 9 THEN NOW()
                     ELSE NULL END,
                CASE WHEN (g % 10) = 9 THEN 'Not within allowable budget limits'
                     ELSE NULL END,
                NOW()
            FROM generate_series(1, 90000) g;
        `);
        const durationGen100k = Date.now() - startGen100k;
        console.log(`Generated additional 90,000 expenses in ${durationGen100k}ms`);

        const count100kRes = await perfPool.query(`SELECT COUNT(*) FROM expenses;`);
        assert('8.2.1', `Scale Tier 2 (100,000 expenses) generated successfully: ${count100kRes.rows[0].count} rows`, 
            Number(count100kRes.rows[0].count) === 100000
        );

        // --- 8.5 EXPLAIN ANALYZE AT 100,000 ROWS ---
        console.log('\n--- 8.5 Query Execution Plans (EXPLAIN ANALYZE at 100,000 rows) ---');
        
        // 1. Model B Aggregation at 100,000 rows
        const explainAgg100k = await perfPool.query(`
            EXPLAIN ANALYZE
            SELECT 
                d.department_id,
                d.department_name,
                COALESCE(SUM(b.allocated_amount), 0) AS total_budget,
                COALESCE(opex.spent, 0) AS opex_spent,
                COALESCE(capex.spent, 0) AS capex_spent
            FROM departments d
            LEFT JOIN budgets b ON b.department_id = d.department_id
            LEFT JOIN (
                SELECT department_id, SUM(amount) AS spent 
                FROM expenses WHERE status = 'approved' AND project_id IS NULL 
                GROUP BY department_id
            ) opex ON opex.department_id = d.department_id
            LEFT JOIN (
                SELECT department_id, SUM(amount) AS spent 
                FROM expenses WHERE status = 'approved' AND project_id IS NOT NULL 
                GROUP BY department_id
            ) capex ON capex.department_id = d.department_id
            GROUP BY d.department_id, d.department_name, opex.spent, capex.spent;
        `);
        const plan100kText = explainAgg100k.rows.map(r => r['QUERY PLAN']).join('\n');
        const execTimeMatch100k = plan100kText.match(/Execution Time: ([\d.]+) ms/);
        const execTime100k = execTimeMatch100k ? parseFloat(execTimeMatch100k[1]) : 0;
        console.log(`Model B Department Comparison Execution Time (100k rows): ${execTime100k} ms`);
        assert('8.2.2', `Model B Department Aggregation executes sub-150ms at 100,000 rows (${execTime100k} ms)`, execTime100k < 150);

        // 2. Global Analytics Summary (SUM of amounts by status) at 100,000 rows
        const explainSum100k = await perfPool.query(`
            EXPLAIN ANALYZE
            SELECT 
                SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_spend,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_spend
            FROM expenses;
        `);
        const planSum100kText = explainSum100k.rows.map(r => r['QUERY PLAN']).join('\n');
        const execTimeMatchSum100k = planSum100kText.match(/Execution Time: ([\d.]+) ms/);
        const execTimeSum100k = execTimeMatchSum100k ? parseFloat(execTimeMatchSum100k[1]) : 0;
        console.log(`Global Summary Aggregation Execution Time (100k rows): ${execTimeSum100k} ms`);
        assert('8.2.3', `Global Summary Aggregation executes sub-100ms at 100,000 rows (${execTimeSum100k} ms)`, execTimeSum100k < 100);

        // --- 8.6 LATENCY BENCHMARK: 100 REPEATED ITERATIONS (P50, P95, P99) ---
        console.log('\n--- 8.6 Repeated Benchmark Latency Distribution (100 Iterations at 100k rows) ---');
        const latencies: number[] = [];
        for (let i = 0; i < 100; i++) {
            const t0 = performance.now();
            await perfPool.query(`
                SELECT 
                    d.department_id, 
                    SUM(e.amount) as dept_spend 
                FROM expenses e 
                JOIN departments d ON e.department_id = d.department_id 
                WHERE e.status = 'approved' 
                GROUP BY d.department_id;
            `);
            latencies.push(performance.now() - t0);
        }

        latencies.sort((a, b) => a - b);
        const p50 = latencies[Math.floor(latencies.length * 0.50)].toFixed(2);
        const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
        const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(2);
        const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);

        console.log(`Latency Percentiles (100k rows): p50=${p50}ms | p95=${p95}ms | p99=${p99}ms | avg=${avg}ms`);
        assert('8.3.1', `p50 latency (${p50}ms) is below 40ms SLA recommendation`, Number(p50) < 40);
        assert('8.3.2', `p95 latency (${p95}ms) is below 80ms SLA recommendation`, Number(p95) < 80);
        assert('8.3.3', `p99 latency (${p99}ms) is below 120ms SLA recommendation`, Number(p99) < 120);

    } finally {
        await perfPool.end();
    }

    return results;
}

if (require.main === module) {
    runPerformanceScalabilityTests()
        .then(results => {
            const failed = results.filter(r => !r.passed);
            console.log(`\nSUB-PHASE 8 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
            if (failed.length > 0) process.exit(1);
        })
        .catch(err => {
            console.error('Fatal in Sub-Phase 8:', err);
            process.exit(1);
        });
}
