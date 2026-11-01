/**
 * FinSight Phase 5: Native Analytics & Reporting Integration Validation Suite
 * Validates against the live NestJS backend running on http://localhost:4000/api/v1
 */

const BACKEND_URL = 'http://localhost:4000/api/v1';

async function loginUser(email: string, password: string = 'Password123!') {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (res.status !== 201 || !json.data?.accessToken) {
    throw new Error(`Login failed for ${email} (${res.status}): ${JSON.stringify(json)}`);
  }
  return json.data.accessToken as string;
}

async function runAnalyticsValidation() {
  console.log('====================================================');
  console.log('🚀 FINSIGHT PHASE 5 NATIVE ANALYTICS VALIDATION SUITE');
  console.log(`Backend Target: ${BACKEND_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function assert(desc: string, testFn: () => Promise<boolean>) {
    try {
      const ok = await testFn();
      if (ok) {
        console.log(`✅ [PASS] ${desc}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${desc}`);
        failed++;
      }
    } catch (e: any) {
      console.error(`❌ [ERROR] ${desc}:`, e?.message || e);
      failed++;
    }
  }

  // 1. Authenticate with each organizational role
  const adminToken = await loginUser('admin@finsight.com', 'admin123');
  const managerToken = await loginUser('manager.engineering@seed.finsight.internal');
  const financeToken = await loginUser('marcus.vance@seed.finsight.internal');
  const employeeToken = await loginUser('emp.eng.1@seed.finsight.internal');

  // --- Test Suite 1: Executive Summary (/analytics/summary) ---
  await assert('1.1 Summary: Admin receives full Model B summary metrics', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    const data = json.data;
    return (
      res.status === 200 &&
      typeof data.total_budget === 'number' &&
      typeof data.total_approved_expenses === 'number' &&
      typeof data.total_pending_expenses === 'number' &&
      typeof data.remaining_budget === 'number' &&
      typeof data.utilization_percentage === 'number' &&
      data.total_budget > 0
    );
  });

  await assert('1.2 Summary: Finance Officer receives identical organization-wide summary', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/summary`, {
      headers: { Authorization: `Bearer ${financeToken}` },
    });
    const json = await res.json();
    return res.status === 200 && json.data.total_budget > 0;
  });

  await assert('1.3 Summary: Query filters (date_from, date_to) return 200 with filtered totals', async () => {
    const res = await fetch(
      `${BACKEND_URL}/analytics/summary?date_from=2024-01-01&date_to=2024-12-31`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const json = await res.json();
    return res.status === 200 && typeof json.data.total_approved_expenses === 'number';
  });

  await assert('1.4 Summary: Department filter (department_id=1) returns scoped summary', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/summary?department_id=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    return res.status === 200 && typeof json.data.total_budget === 'number';
  });

  await assert('1.5 Summary: Employee receives status 200 with zero budget scope', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/summary`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const json = await res.json();
    return res.status === 200 && json.data.total_budget === 0;
  });

  // --- Test Suite 2: Monthly Trend (/analytics/monthly-trend) ---
  await assert('2.1 Monthly Trend: Returns chronological array with month (YYYY-MM) and total', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/monthly-trend`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    const list = json.data;
    const isValidFormat =
      Array.isArray(list) &&
      list.length > 0 &&
      list.every(
        (item: any) =>
          typeof item.month === 'string' &&
          /^\d{4}-\d{2}$/.test(item.month) &&
          typeof item.total === 'number'
      );
    return res.status === 200 && isValidFormat;
  });

  await assert('2.2 Monthly Trend: Query with date window filters months accurately', async () => {
    const res = await fetch(
      `${BACKEND_URL}/analytics/monthly-trend?date_from=2024-01-01&date_to=2024-06-30`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const json = await res.json();
    const list = json.data;
    const allWithin2024H1 = list.every((item: any) => item.month >= '2024-01' && item.month <= '2024-06');
    return res.status === 200 && allWithin2024H1;
  });

  await assert('2.3 Monthly Trend: Accessible to all roles including Employee', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/monthly-trend`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const json = await res.json();
    return res.status === 200 && Array.isArray(json.data);
  });

  // --- Test Suite 3: Category Breakdown (/analytics/category-breakdown) ---
  await assert('3.1 Category Breakdown: Returns category_id, category_name, and total', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/category-breakdown`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    const list = json.data;
    return (
      res.status === 200 &&
      Array.isArray(list) &&
      list.length > 0 &&
      list.every(
        (c: any) =>
          typeof c.category_id === 'string' &&
          typeof c.category_name === 'string' &&
          typeof c.total === 'number'
      )
    );
  });

  await assert('3.2 Category Breakdown: Accessible to Employee role', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/category-breakdown`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    const json = await res.json();
    return res.status === 200 && Array.isArray(json.data);
  });

  // --- Test Suite 4: Department Comparison (/analytics/department-comparison) ---
  await assert('4.1 Dept Comparison: Admin receives nested department object and Model B metrics', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/department-comparison`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    const list = json.data;
    const isValid =
      Array.isArray(list) &&
      list.length > 0 &&
      list.every(
        (row: any) =>
          row.department &&
          typeof row.department.department_id === 'string' &&
          typeof row.department.department_name === 'string' &&
          typeof row.totalApproved === 'number' &&
          typeof row.allocatedBudget === 'number' &&
          (row.utilizationPercentage === null || typeof row.utilizationPercentage === 'number') &&
          typeof row.isOverrun === 'boolean'
      );
    return res.status === 200 && isValid;
  });

  await assert('4.2 Dept Comparison: Department Manager receives 200 scoped to managed department', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/department-comparison`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const json = await res.json();
    return res.status === 200 && Array.isArray(json.data) && json.data.length >= 1;
  });

  await assert('4.3 Dept Comparison: Employee role receives 403 Forbidden', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/department-comparison`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    return res.status === 403;
  });

  // --- Test Suite 5: Project Performance (/analytics/project-performance) ---
  await assert('5.1 Project Performance: Admin receives CapEx allocations and spent balances', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/project-performance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    const list = json.data;
    const isValid =
      Array.isArray(list) &&
      list.length > 0 &&
      list.every(
        (p: any) =>
          typeof p.project_id === 'string' &&
          typeof p.project_name === 'string' &&
          typeof p.allocated_budget === 'number' &&
          typeof p.total_spent === 'number' &&
          typeof p.remaining_budget === 'number' &&
          typeof p.utilization_percentage === 'number'
      );
    return res.status === 200 && isValid;
  });

  await assert('5.2 Project Performance: Manager receives 200 for department projects', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/project-performance`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const json = await res.json();
    return res.status === 200 && Array.isArray(json.data);
  });

  await assert('5.3 Project Performance: Employee role receives 403 Forbidden', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/project-performance`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    return res.status === 403;
  });

  console.log('\n====================================================');
  console.log(`📊 PHASE 5 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAnalyticsValidation().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
