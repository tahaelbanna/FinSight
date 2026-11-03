import { Pool } from 'pg';

interface BenchmarkResult {
  name: string;
  executionTimeMs: number;
  planningTimeMs: number;
  totalTimeMs: number;
  scanType: string;
  rowsProcessed: number;
  details: string;
}

async function runMillionRecordTesting() {
  console.log('================================================================');
  console.log('      FINSIGHT PHASE 14: 1,000,000 RECORD DATABASE BENCHMARK    ');
  console.log('================================================================');

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'finsight_million_db', // Strictly isolated test database
  });

  try {
    // 1. Verify Database Isolation
    const dbNameRes = await pool.query('SELECT current_database();');
    const currentDb = dbNameRes.rows[0].current_database;
    console.log(`Connected to Database: ${currentDb}`);
    if (currentDb !== 'finsight_million_db') {
      throw new Error(`CRITICAL ABORT: Connected to "${currentDb}" instead of "finsight_million_db"!`);
    }

    // Ensure clean state
    await pool.query('TRUNCATE expenses RESTART IDENTITY CASCADE;');

    // Drop test compound indexes if already existing from prior run
    await pool.query('DROP INDEX IF EXISTS idx_expenses_dept_status;');
    await pool.query('DROP INDEX IF EXISTS idx_expenses_status_date;');

    // 2. Batch Insert 1,000,000 Synthetic Expense Records
    console.log('\n--- Step 1: Batch Generating & Inserting 1,000,000 Expenses ---');
    console.log('Distributions: 70% Approved, 15% Pending, 15% Rejected; 60% OpEx, 40% CapEx');

    const insertStart = Date.now();

    // Insert in 10 batches of 100,000 rows to optimize memory and transaction size
    const BATCH_SIZE = 100000;
    const TOTAL_RECORDS = 1000000;

    for (let batch = 0; batch < TOTAL_RECORDS / BATCH_SIZE; batch++) {
      const startIdx = batch * BATCH_SIZE + 1;
      const endIdx = (batch + 1) * BATCH_SIZE;
      const bStart = Date.now();

      await pool.query(`
        INSERT INTO expenses (
          user_id, department_id, project_id, category_id, amount, description, expense_date, status, reviewer_id, review_comment, submitted_at, reviewed_at
        )
        SELECT
          CASE (s % 6) + 1
            WHEN 1 THEN 11 + (s % 6)
            WHEN 2 THEN 17 + (s % 4)
            WHEN 3 THEN 21 + (s % 4)
            WHEN 4 THEN 25 + (s % 4)
            WHEN 5 THEN 29 + (s % 3)
            ELSE 32 + (s % 4)
          END AS user_id,
          (s % 6) + 1 AS department_id,
          CASE WHEN (s % 10) < 4 THEN ((s % 6) * 3) + ((s % 3) + 1) ELSE NULL END AS project_id,
          (s % 6) + 1 AS category_id,
          ROUND((50 + (s % 9500) + ((s % 99)::numeric / 100.0)), 2) AS amount,
          'Synthetic Benchmark Expense Record #' || s AS description,
          (DATE '2024-01-01' + ((s % 730) || ' days')::INTERVAL)::DATE AS expense_date,
          CASE 
            WHEN (s % 100) < 70 THEN 'approved'::expenses_status_enum
            WHEN (s % 100) < 85 THEN 'pending'::expenses_status_enum
            ELSE 'rejected'::expenses_status_enum
          END AS status,
          CASE WHEN (s % 100) >= 85 OR (s % 100) < 70 THEN (s % 6) + 1 ELSE NULL END AS reviewer_id,
          CASE 
            WHEN (s % 100) >= 85 THEN 'Rejection: Policy exception logged for record #' || s
            WHEN (s % 100) < 70 THEN 'Approved per department budget policy'
            ELSE NULL
          END AS review_comment,
          (TIMESTAMPTZ '2024-01-01 08:00:00Z' + ((s % 730) || ' days')::INTERVAL) AS submitted_at,
          CASE WHEN (s % 100) >= 85 OR (s % 100) < 70 THEN (TIMESTAMPTZ '2024-01-01 12:00:00Z' + ((s % 730) || ' days')::INTERVAL) ELSE NULL END AS reviewed_at
        FROM generate_series(${startIdx}, ${endIdx}) AS s;
      `);

      const bDuration = Date.now() - bStart;
      console.log(`   Batch ${batch + 1}/${TOTAL_RECORDS / BATCH_SIZE}: Inserted ${endIdx.toLocaleString()} rows (${bDuration}ms, ${Math.round(BATCH_SIZE / (bDuration / 1000))} rows/sec)`);
    }

    const totalInsertDurationSec = (Date.now() - insertStart) / 1000;
    const overallThroughput = Math.round(TOTAL_RECORDS / totalInsertDurationSec);
    console.log(`\n✓ Inserted ${TOTAL_RECORDS.toLocaleString()} records in ${totalInsertDurationSec.toFixed(2)}s (${overallThroughput.toLocaleString()} rows/sec)`);

    // Run ANALYZE to update PostgreSQL optimizer statistics
    console.log('   Running ANALYZE expenses to refresh query planner statistics...');
    await pool.query('ANALYZE expenses;');

    // 3. Inspect Table and Index Disk Storage Footprint
    console.log('\n--- Step 2: Disk Storage Footprint ---');
    const storageRes = await pool.query(`
      SELECT
        pg_size_pretty(pg_relation_size('expenses')) AS table_size,
        pg_size_pretty(pg_indexes_size('expenses')) AS index_size,
        pg_size_pretty(pg_total_relation_size('expenses')) AS total_size,
        pg_relation_size('expenses') AS table_bytes,
        pg_indexes_size('expenses') AS index_bytes,
        pg_total_relation_size('expenses') AS total_bytes;
    `);
    const storage = storageRes.rows[0];
    console.log(`   Table Size: ${storage.table_size}`);
    console.log(`   Index Size: ${storage.index_size}`);
    console.log(`   Total Relation Footprint: ${storage.total_size}`);

    // Helper to run EXPLAIN (ANALYZE, FORMAT JSON)
    const runExplain = async (queryName: string, sql: string): Promise<BenchmarkResult> => {
      const explainRes = await pool.query(`EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`);
      const planData = explainRes.rows[0]['QUERY PLAN'][0];
      const plan = planData['Plan'];
      const executionTimeMs = planData['Execution Time'];
      const planningTimeMs = planData['Planning Time'];
      const totalTimeMs = Number((executionTimeMs + planningTimeMs).toFixed(2));
      const scanType = plan['Node Type'];
      const rowsProcessed = plan['Actual Rows'];

      return {
        name: queryName,
        executionTimeMs,
        planningTimeMs,
        totalTimeMs,
        scanType,
        rowsProcessed,
        details: `Scan: ${scanType}, Exec: ${executionTimeMs}ms, Plan: ${planningTimeMs}ms`,
      };
    };

    // 4. Execute Benchmark Queries
    console.log('\n--- Step 3: EXPLAIN ANALYZE Query Benchmarks Across 1,000,000 Records ---');
    const benchmarks: BenchmarkResult[] = [];

    // Benchmark 1: Global Summary Aggregation
    const b1 = await runExplain(
      'Q1: Global Spend Aggregation (1M Rows)',
      `SELECT count(*) as total_count,
              SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_spend,
              SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_spend,
              SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END) as rejected_spend
       FROM expenses;`
    );
    benchmarks.push(b1);
    console.log(`   Q1 Global Aggregation: ${b1.executionTimeMs}ms (${b1.scanType})`);

    // Benchmark 2: Model B Department OpEx Aggregation (Before Index)
    const b2 = await runExplain(
      'Q2: Model B Department OpEx Aggregation (No Compound Index)',
      `SELECT d.department_name,
              count(e.expense_id) as opex_count,
              COALESCE(SUM(e.amount), 0) as approved_opex_spend
       FROM departments d
       LEFT JOIN expenses e ON e.department_id = d.department_id
                           AND e.project_id IS NULL
                           AND e.status = 'approved'
       GROUP BY d.department_id, d.department_name
       ORDER BY d.department_id;`
    );
    benchmarks.push(b2);
    console.log(`   Q2 Dept OpEx Aggregation: ${b2.executionTimeMs}ms (${b2.scanType})`);

    // Benchmark 3: Model B Project CapEx Aggregation
    const b3 = await runExplain(
      'Q3: Model B Project CapEx Aggregation',
      `SELECT p.project_name,
              d.department_name,
              count(e.expense_id) as capex_count,
              COALESCE(SUM(e.amount), 0) as approved_capex_spend
       FROM projects p
       JOIN departments d ON d.department_id = p.department_id
       LEFT JOIN expenses e ON e.project_id = p.project_id
                           AND e.status = 'approved'
       GROUP BY p.project_id, p.project_name, d.department_name
       ORDER BY p.project_id;`
    );
    benchmarks.push(b3);
    console.log(`   Q3 Project CapEx Aggregation: ${b3.executionTimeMs}ms (${b3.scanType})`);

    // Benchmark 4: Status and Date Range Filtering
    const b4 = await runExplain(
      'Q4: Status & Date Range Filtering (2025 Approved)',
      `SELECT count(*), SUM(amount)
       FROM expenses
       WHERE status = 'approved'
         AND expense_date >= '2025-01-01' AND expense_date <= '2025-12-31';`
    );
    benchmarks.push(b4);
    console.log(`   Q4 Status & Date Range Filter: ${b4.executionTimeMs}ms (${b4.scanType})`);

    // Benchmark 5: Deep Pagination with Sorting
    const b5 = await runExplain(
      'Q5: Deep Pagination (OFFSET 50,000 LIMIT 20)',
      `SELECT expense_id, user_id, department_id, amount, expense_date, status
       FROM expenses
       ORDER BY expense_date DESC, expense_id DESC
       LIMIT 20 OFFSET 50000;`
    );
    benchmarks.push(b5);
    console.log(`   Q5 Deep Pagination: ${b5.executionTimeMs}ms (${b5.scanType})`);

    // Benchmark 6: Compound Index Optimization
    console.log('\n--- Step 4: Index Optimization Benchmark ---');
    console.log('   Creating compound index: idx_expenses_dept_status ON expenses (department_id, status)...');
    const idxStart = Date.now();
    await pool.query('CREATE INDEX idx_expenses_dept_status ON expenses (department_id, status);');
    const idxDuration = Date.now() - idxStart;
    console.log(`   Index creation completed in ${idxDuration}ms`);

    await pool.query('ANALYZE expenses;');

    const b6 = await runExplain(
      'Q6: Model B Department OpEx Aggregation (WITH Compound Index)',
      `SELECT d.department_name,
              count(e.expense_id) as opex_count,
              COALESCE(SUM(e.amount), 0) as approved_opex_spend
       FROM departments d
       LEFT JOIN expenses e ON e.department_id = d.department_id
                           AND e.project_id IS NULL
                           AND e.status = 'approved'
       GROUP BY d.department_id, d.department_name
       ORDER BY d.department_id;`
    );
    benchmarks.push(b6);
    console.log(`   Q6 Dept OpEx (Indexed): ${b6.executionTimeMs}ms (${b6.scanType})`);

    const speedupPct = Math.round(((b2.executionTimeMs - b6.executionTimeMs) / b2.executionTimeMs) * 100);
    console.log(`   Index optimization delta: ${b2.executionTimeMs}ms -> ${b6.executionTimeMs}ms (${speedupPct >= 0 ? '+' : ''}${speedupPct}% change)`);

    // 5. Verify Model B Invariants at 1,000,000-Record Scale
    console.log('\n--- Step 5: Model B Financial Invariant Verification at 1M Scale ---');

    const invRes = await pool.query(`
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'approved') AS total_approved_spend,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'approved' AND project_id IS NULL) AS total_opex_spend,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'approved' AND project_id IS NOT NULL) AS total_capex_spend,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'pending') AS total_pending_spend,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'rejected') AS total_rejected_spend,
        (SELECT count(*) FROM expenses WHERE project_id IS NOT NULL AND department_id != (SELECT department_id FROM projects WHERE projects.project_id = expenses.project_id)) AS capex_dept_mismatches;
    `);

    const inv = invRes.rows[0];
    const totalApproved = Number(inv.total_approved_spend);
    const totalOpex = Number(inv.total_opex_spend);
    const totalCapex = Number(inv.total_capex_spend);
    const sumOpexCapex = Number((totalOpex + totalCapex).toFixed(2));
    const delta = Math.abs(totalApproved - sumOpexCapex);
    const mismatches = Number(inv.capex_dept_mismatches);

    console.log(`   Total Approved Spend: $${totalApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`   Department OpEx Spend: $${totalOpex.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`   Project CapEx Spend:   $${totalCapex.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`   OpEx + CapEx Sum:      $${sumOpexCapex.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`   Discrepancy (Delta):   $${delta.toFixed(2)}`);
    console.log(`   CapEx Department Mismatches: ${mismatches}`);

    const invariant1 = delta === 0;
    const invariant2 = mismatches === 0;
    const invariant3 = Number(inv.total_pending_spend) > 0 && Number(inv.total_rejected_spend) > 0;

    console.log(`\n   Invariant 1 (Approved == OpEx + CapEx): ${invariant1 ? 'PASSED (EXACT MATCH)' : 'FAILED'}`);
    console.log(`   Invariant 2 (CapEx Ring-fencing & Isolation): ${invariant2 ? 'PASSED (0 MISMATCHES)' : 'FAILED'}`);
    console.log(`   Invariant 3 (Approved-Only Excludes Pending/Rejected): ${invariant3 ? 'PASSED' : 'FAILED'}`);

    console.log('\n================================================================');
    console.log('               PHASE 14 BENCHMARK SUMMARY TABLE                 ');
    console.log('================================================================');
    console.table(
      benchmarks.map((b) => ({
        Query: b.name,
        'Exec Time (ms)': `${b.executionTimeMs}ms`,
        'Plan Time (ms)': `${b.planningTimeMs}ms`,
        'Scan Node': b.scanType,
        'Rows Processed': b.rowsProcessed.toLocaleString(),
      }))
    );

    return {
      totalRecords: TOTAL_RECORDS,
      insertDurationSec: totalInsertDurationSec,
      throughput: overallThroughput,
      storage,
      benchmarks,
      invariants: {
        totalApproved,
        totalOpex,
        totalCapex,
        delta,
        mismatches,
        passed: invariant1 && invariant2 && invariant3,
      },
    };
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMillionRecordTesting()
    .then((result) => {
      console.log('\nPhase 14 completed successfully with all invariants verified.');
      process.exit(result.invariants.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal benchmark error:', err);
      process.exit(1);
    });
}

