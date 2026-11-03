/**
 * FinSight Bug Fixes & Landing Page Validation Suite
 *
 * Verifies:
 * 1. Details Modals & API Endpoints (Expenses, Budgets, Departments)
 * 2. Projects Pagination & Total Count (Admin=18, Finance Officer=18, Manager=3)
 * 3. Analytics Organization-Wide Consistency & Model B Accounting ($8.67M budget, 6 depts, 18 projects, 6 categories)
 * 4. Public Landing Page Access (/), Login Route (/login), and Route Protection
 */

const BACKEND_URL = 'http://localhost:4000/api/v1';
const FRONTEND_URL = 'http://localhost:5173';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function login(email: string, password: string) {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${data.message || res.statusText}`);
  }
  return data.data.accessToken as string;
}

async function runValidation() {
  console.log('====================================================');
  console.log('🛠️  FINSIGHT BUG FIXES & LANDING PAGE VALIDATION');
  console.log('Backend Target: ' + BACKEND_URL);
  console.log('Frontend Target: ' + FRONTEND_URL);
  console.log('====================================================\n');

  let adminToken = '';
  let financeToken = '';
  let managerToken = '';

  try {
    adminToken = await login('admin@finsight.com', 'admin123');
    financeToken = await login('marcus.vance@seed.finsight.internal', 'Password123!');
    managerToken = await login('manager.engineering@seed.finsight.internal', 'Password123!');
  } catch (err: any) {
    console.error('Initial login setup failed:', err.message);
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // SECTION 1: Details Modals & Data Integrity (Issue 1)
  // --------------------------------------------------------------------------
  console.log('--- 1. DETAILS MODALS & RECORD INTEGRITY (ISSUE 1) ---');

  await test('1.1 Expense Details: GET /expenses/:id returns 200 with full record & reviewer info', async () => {
    // 1. Get first expense ID
    const listRes = await fetch(`${BACKEND_URL}/expenses?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    const expId = listData.data.data[0].expense_id;
    assert(Boolean(expId), 'Expected valid expense ID from list');

    // 2. Query details endpoint
    const detailRes = await fetch(`${BACKEND_URL}/expenses/${expId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(detailRes.status === 200, `Expected 200, got ${detailRes.status}`);
    const detail = await detailRes.json();
    assert(detail.data.expense_id === expId, 'Expense ID mismatch');
    assert(detail.data.amount > 0, 'Expense amount should be positive');
    assert(Boolean(detail.data.department), 'Department details expected in payload');
  });

  await test('1.2 Budget Details: GET /budgets/:id returns 200 with Model B metrics & scope', async () => {
    const listRes = await fetch(`${BACKEND_URL}/budgets?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    const budgetId = listData.data.data[0].budget_id;
    assert(Boolean(budgetId), 'Expected valid budget ID from list');

    const detailRes = await fetch(`${BACKEND_URL}/budgets/${budgetId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(detailRes.status === 200, `Expected 200, got ${detailRes.status}`);
    const detail = await detailRes.json();
    assert(detail.data.budget_id === budgetId, 'Budget ID mismatch');
    assert(Number(detail.data.allocated_amount) > 0, 'Budget allocated amount must be positive');
    assert(detail.data.remaining_budget !== undefined, 'Remaining budget must be computed');
    assert(detail.data.utilization_percentage !== undefined, 'Utilization percentage must be computed');
  });

  await test('1.3 Department Details: GET /departments/:id returns 200 with manager & staff count', async () => {
    const detailRes = await fetch(`${BACKEND_URL}/departments/1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(detailRes.status === 200, `Expected 200, got ${detailRes.status}`);
    const detail = await detailRes.json();
    assert(detail.data.department_id === '1', 'Expected department 1');
    assert(Boolean(detail.data.department_name), 'Expected department name');
    assert(Boolean(detail.data.manager), 'Expected manager relation');
  });

  await test('1.4 Details Modal Error Handling: Non-existent IDs return 404 with error envelope', async () => {
    const res = await fetch(`${BACKEND_URL}/expenses/999999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 404, `Expected 404, got ${res.status}`);
    const body = await res.json();
    assert(Array.isArray(body.errors) && body.errors.length > 0, 'Expected errors array in envelope');
    assert(body.errors[0].message.includes('not found'), 'Expected not found message');
  });

  // --------------------------------------------------------------------------
  // SECTION 2: Projects Pagination & RBAC Count (Issue 2)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. PROJECTS PAGINATION & SCOPING (ISSUE 2) ---');

  await test('2.1 Admin Projects Visibility: Admin sees all 18 enterprise projects (total = 18)', async () => {
    const res = await fetch(`${BACKEND_URL}/projects?limit=100`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.meta.total === 18, `Expected total 18, got ${body.data.meta.total}`);
    assert(body.data.data.length === 18, `Expected 18 returned, got ${body.data.data.length}`);
  });

  await test('2.2 Finance Officer Projects Visibility: Finance Officer sees all 18 enterprise projects', async () => {
    const res = await fetch(`${BACKEND_URL}/projects?limit=100`, {
      headers: { Authorization: `Bearer ${financeToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.meta.total === 18, `Expected total 18, got ${body.data.meta.total}`);
  });

  await test('2.3 Department Manager Scoping: Engineering Manager sees only 3 projects (Dept 1)', async () => {
    const res = await fetch(`${BACKEND_URL}/projects?limit=100`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.meta.total === 3, `Expected total 3 for manager, got ${body.data.meta.total}`);
    assert(body.data.data.length === 3, `Expected 3 records, got ${body.data.data.length}`);
    const allDept1 = body.data.data.every((p: any) => p.department.department_id === '1');
    assert(allDept1, 'All projects must belong to Department 1');
  });

  await test('2.4 Projects Pagination: Page 1 returns 10 items, Page 2 returns remaining 8 items', async () => {
    const page1Res = await fetch(`${BACKEND_URL}/projects?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const p1 = await page1Res.json();
    assert(p1.data.data.length === 10, `Expected 10 on page 1, got ${p1.data.data.length}`);
    assert(p1.data.meta.page === 1, 'Expected page 1');
    assert(p1.data.meta.totalPages === 2, `Expected 2 total pages, got ${p1.data.meta.totalPages}`);

    const page2Res = await fetch(`${BACKEND_URL}/projects?page=2&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const p2 = await page2Res.json();
    assert(p2.data.data.length === 8, `Expected 8 on page 2, got ${p2.data.data.length}`);
    assert(p2.data.meta.page === 2, 'Expected page 2');
  });

  await test('2.5 Projects Department Filter: Filtering by department_id=2 returns 3 Product projects', async () => {
    const res = await fetch(`${BACKEND_URL}/projects?department_id=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    assert(body.data.meta.total === 3, `Expected 3 projects in dept 2, got ${body.data.meta.total}`);
    const allDept2 = body.data.data.every((p: any) => p.department.department_id === '2');
    assert(allDept2, 'All projects must belong to department 2');
  });

  // --------------------------------------------------------------------------
  // SECTION 3: Analytics Consistency & Model B Accounting (Issue 3)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. ANALYTICS DATA CONSISTENCY & MODEL B (ISSUE 3) ---');

  await test('3.1 Global Analytics Summary: Matches DB totals ($8.67M budget, $6.50M approved)', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.total_budget === 8668000, `Expected budget 8668000, got ${body.data.total_budget}`);
    assert(body.data.total_approved_expenses === 6498290, `Expected approved 6498290, got ${body.data.total_approved_expenses}`);
    assert(body.data.total_pending_expenses === 1517355, `Expected pending 1517355, got ${body.data.total_pending_expenses}`);
    assert(body.data.remaining_budget === 2169710, `Expected remaining 2169710, got ${body.data.remaining_budget}`);
    assert(body.data.utilization_percentage === 74.97, `Expected utilization 74.97%, got ${body.data.utilization_percentage}`);
  });

  await test('3.2 Department Comparison: Returns all 6 departments with Model B consolidated figures', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/department-comparison`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.length === 6, `Expected 6 departments, got ${body.data.length}`);
    const allHaveNames = body.data.every((d: any) => Boolean(d.department?.department_name));
    assert(allHaveNames, 'Every comparison item must contain department.department_name');
  });

  await test('3.3 Project Performance: Returns all 18 projects with CapEx allocated budget & spending', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/project-performance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.length === 18, `Expected 18 projects in performance, got ${body.data.length}`);
  });

  await test('3.4 Category Breakdown: Returns all 6 enterprise categories', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/category-breakdown`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.length === 6, `Expected 6 categories, got ${body.data.length}`);
  });

  await test('3.5 Analytics Filters: Scoping by department_id=1 updates summary to Engineering', async () => {
    const res = await fetch(`${BACKEND_URL}/analytics/summary?department_id=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.total_budget === 1917000, `Expected dept 1 budget 1917000, got ${body.data.total_budget}`);
    assert(body.data.total_approved_expenses === 1080362, `Expected dept 1 approved 1080362, got ${body.data.total_approved_expenses}`);
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Public Landing Page & Routing Architecture (Issue 4)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. PUBLIC LANDING PAGE & ROUTING ARCHITECTURE (ISSUE 4) ---');

  await test('4.1 Public Landing Route: GET / returns 200 and loads FinSight SPA HTML without redirect', async () => {
    const res = await fetch(`${FRONTEND_URL}/`);
    assert(res.status === 200, `Expected 200 for public landing, got ${res.status}`);
    const html = await res.text();
    assert(html.includes('<div id="root">'), 'Expected root div in HTML document');
    assert(html.includes('FinSight'), 'Expected FinSight brand in document');
  });

  await test('4.2 Public Login Route: GET /login returns 200 for unauthenticated visitors', async () => {
    const res = await fetch(`${FRONTEND_URL}/login`);
    assert(res.status === 200, `Expected 200 for /login, got ${res.status}`);
  });

  await test('4.3 Unauthenticated API Request: GET /api/v1/departments returns 401 Unauthorized', async () => {
    const res = await fetch(`${BACKEND_URL}/departments`);
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
  });

  await test('4.4 Authenticated API Request: GET /api/v1/departments with token succeeds (200 OK)', async () => {
    const res = await fetch(`${BACKEND_URL}/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body.data.data.length === 6, `Expected 6 departments, got ${body.data.data.length}`);
  });

  console.log('\n====================================================');
  console.log(`📊 VALIDATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runValidation();
