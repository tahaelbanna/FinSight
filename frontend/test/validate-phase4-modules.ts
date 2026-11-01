import assert from 'node:assert';

const API_BASE = 'http://localhost:4000/api/v1';

async function loginUser(email: string, password: string = 'Password123!') {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  }
  return {
    accessToken: body.data.accessToken,
    user: body.data.user,
  };
}

function unpack(json: any) {
  if (json?.data && Array.isArray(json.data.data)) {
    return { data: json.data.data, meta: json.data.meta };
  }
  if (Array.isArray(json?.data)) {
    return { data: json.data, meta: json.meta };
  }
  return { data: [], meta: null };
}

async function runPhase4Validation() {
  console.log('====================================================');
  console.log('🚀 FINSIGHT PHASE 4 CORE BUSINESS MODULES VALIDATION');
  console.log(`Backend Target: ${API_BASE}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  };

  // Log in as different actors
  const adminAuth = await loginUser('admin@finsight.com', 'admin123');
  const managerAuth = await loginUser('manager.engineering@seed.finsight.internal', 'Password123!');
  const financeAuth = await loginUser('marcus.vance@seed.finsight.internal', 'Password123!');
  const employeeAuth = await loginUser('emp.eng.1@seed.finsight.internal', 'Password123!');

  // MODULE A: Expenses
  await test('Module A: Fetch categories (relational entities with category_id and category_name)', async () => {
    const res = await fetch(`${API_BASE}/expenses/categories`, {
      headers: { Authorization: `Bearer ${employeeAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json.data), 'data should be an array');
    assert(json.data.length >= 6, 'should contain at least 6 categories');
    const firstCat = json.data[0];
    assert(firstCat.category_id, 'category_id required');
    assert(firstCat.category_name, 'category_name required');
  });

  await test('Module A: Fetch paginated expenses list', async () => {
    const res = await fetch(`${API_BASE}/expenses?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${employeeAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const result = unpack(json);
    assert(Array.isArray(result.data), 'data should be an array');
    assert(result.meta, 'meta should exist');
    assert.strictEqual(typeof result.meta.total, 'number');
  });

  // MODULE B: Approvals
  await test('Module B: Manager can access pending approvals queue', async () => {
    const res = await fetch(`${API_BASE}/approvals/pending`, {
      headers: { Authorization: `Bearer ${managerAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const result = unpack(json);
    assert(Array.isArray(result.data), 'pending approvals should be an array');
  });

  await test('Module B: Employee is forbidden from accessing approvals queue (403)', async () => {
    const res = await fetch(`${API_BASE}/approvals/pending`, {
      headers: { Authorization: `Bearer ${employeeAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  // MODULE C: Budgets
  await test('Module C: Budgets listing supports Model B OpEx / CapEx scope', async () => {
    const res = await fetch(`${API_BASE}/budgets?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${financeAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const result = unpack(json);
    assert(Array.isArray(result.data));
    if (result.data.length > 0) {
      const budget = result.data[0];
      assert(budget.budget_id, 'budget_id required');
      assert.strictEqual(typeof budget.allocated_amount, 'number');
      assert.strictEqual(typeof budget.approved_expenses, 'number');
      assert.strictEqual(typeof budget.remaining_budget, 'number');
      assert.strictEqual(typeof budget.utilization_percentage, 'number');
      assert(budget.department || budget.project, 'must have department or project scope');
    }
  });

  await test('Module C: Employee is forbidden from creating budgets (403)', async () => {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeAuth.accessToken}`,
      },
      body: JSON.stringify({
        allocated_amount: 10000,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      }),
    });
    assert.strictEqual(res.status, 403);
  });

  // MODULE D: Projects
  await test('Module D: Projects listing returns department relations', async () => {
    const res = await fetch(`${API_BASE}/projects?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${employeeAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const result = unpack(json);
    assert(Array.isArray(result.data));
    if (result.data.length > 0) {
      const proj = result.data[0];
      assert(proj.project_id);
      assert(proj.project_name);
      assert(proj.department, 'department relation required');
      assert(proj.status);
    }
  });

  await test('Module D: Employee cannot create projects (403)', async () => {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeAuth.accessToken}`,
      },
      body: JSON.stringify({
        project_name: 'Unauthorized Project',
        department_id: 'some-id',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      }),
    });
    assert.strictEqual(res.status, 403);
  });

  // MODULE E: Departments
  await test('Module E: Departments listing returns manager and users count', async () => {
    const res = await fetch(`${API_BASE}/departments?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${employeeAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const result = unpack(json);
    assert(Array.isArray(result.data));
    assert(result.data.length >= 6, 'expected at least 6 seeded departments');
    const dept = result.data[0];
    assert(dept.department_id);
    assert(dept.department_name);
    assert.strictEqual(typeof dept.usersCount, 'number');
  });

  await test('Module E: Non-Admin cannot delete department (403)', async () => {
    const res = await fetch(`${API_BASE}/departments/fake-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managerAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  // MODULE F: User Management
  await test('Module F: Admin can query users list without password_hash exposed', async () => {
    const res = await fetch(`${API_BASE}/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const result = unpack(json);
    assert(Array.isArray(result.data));
    assert(result.data.length > 0);
    const u = result.data[0];
    assert(u.user_id);
    assert(u.email);
    assert.strictEqual(u.password_hash, undefined, 'password_hash must NEVER be exposed');
  });

  await test('Module F: Manager & Employee are forbidden from user management (403)', async () => {
    const resManager = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${managerAuth.accessToken}` },
    });
    assert.strictEqual(resManager.status, 403);

    const resEmployee = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${employeeAuth.accessToken}` },
    });
    assert.strictEqual(resEmployee.status, 403);
  });

  // MODULE G: Notifications
  await test('Module G: Authenticated user can query notifications and unread count', async () => {
    const res = await fetch(`${API_BASE}/notifications?isRead=false&limit=1`, {
      headers: { Authorization: `Bearer ${employeeAuth.accessToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const result = unpack(json);
    assert(Array.isArray(result.data));
    assert(result.meta, 'meta with unread count required');
    assert.strictEqual(typeof result.meta.total, 'number');
  });

  // MODULE H: Activity Logs
  await test('Module H: Admin, Finance Officer, and Manager can view audit logs', async () => {
    const resAdmin = await fetch(`${API_BASE}/activity-logs?limit=5`, {
      headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
    });
    assert.strictEqual(resAdmin.status, 200);

    const resFinance = await fetch(`${API_BASE}/activity-logs?limit=5`, {
      headers: { Authorization: `Bearer ${financeAuth.accessToken}` },
    });
    assert.strictEqual(resFinance.status, 200);

    const resManager = await fetch(`${API_BASE}/activity-logs?limit=5`, {
      headers: { Authorization: `Bearer ${managerAuth.accessToken}` },
    });
    assert.strictEqual(resManager.status, 200);
  });

  await test('Module H: Employee is unauthorized from accessing activity logs', async () => {
    const res = await fetch(`${API_BASE}/activity-logs?limit=5`, {
      headers: { Authorization: `Bearer ${employeeAuth.accessToken}` },
    });
    assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`);
  });

  console.log('\n====================================================');
  console.log(`📊 PHASE 4 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runPhase4Validation().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
