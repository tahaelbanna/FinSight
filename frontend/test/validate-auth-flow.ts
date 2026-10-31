/**
 * FinSight End-to-End Validation Test Suite for Phase 2 & Phase 3
 * Validates against the live NestJS backend running on http://localhost:4000
 */

const BACKEND_URL = 'http://localhost:4000/api/v1';

// Base64Url decode helper
function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
}

async function runValidationSuite() {
  console.log('====================================================');
  console.log('🚀 FINSIGHT FRONTEND FOUNDATION & AUTH VALIDATION SUITE');
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

  // --- Test 1: Successful Login for All 4 Roles ---
  await assert('1.1 Successful Login: System Admin (admin@finsight.com)', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@finsight.com', password: 'admin123' }),
    });
    const json = await res.json();
    const payload = parseJwt(json.data.accessToken);
    return res.status === 201 && payload.role === 'admin' && !!json.data.refreshToken;
  });

  await assert('1.2 Successful Login: Department Manager', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.engineering@seed.finsight.internal',
        password: 'Password123!',
      }),
    });
    const json = await res.json();
    const payload = parseJwt(json.data.accessToken);
    return res.status === 201 && payload.role === 'manager' && !!payload.department_id;
  });

  await assert('1.3 Successful Login: Finance Officer', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'marcus.vance@seed.finsight.internal',
        password: 'Password123!',
      }),
    });
    const json = await res.json();
    const payload = parseJwt(json.data.accessToken);
    return res.status === 201 && payload.role === 'finance_officer';
  });

  await assert('1.4 Successful Login: Employee', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'emp.eng.1@seed.finsight.internal',
        password: 'Password123!',
      }),
    });
    const json = await res.json();
    const payload = parseJwt(json.data.accessToken);
    return res.status === 201 && payload.role === 'employee';
  });

  // --- Test 2: Invalid Credentials ---
  await assert('2. Invalid Credentials: wrong password returns 401 with unified envelope', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@finsight.com', password: 'WrongPassword999!' }),
    });
    const json = await res.json();
    return (
      res.status === 401 &&
      Array.isArray(json.errors) &&
      json.errors[0].message === 'Invalid credentials.'
    );
  });

  // --- Test 3: Inactive Account Response ---
  await assert('3. Inactive Account: returns 403 Forbidden with Account is deactivated message', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'emp.eng.6@seed.finsight.internal',
        password: 'Password123!',
      }),
    });
    const json = await res.json();
    return (
      res.status === 403 &&
      Array.isArray(json.errors) &&
      json.errors[0].message === 'Account is deactivated.'
    );
  });

  // --- Test 4: Accessing Protected Route While Unauthenticated ---
  await assert('4. Access Protected Route: unauthenticated request to /departments returns 401', async () => {
    const res = await fetch(`${BACKEND_URL}/departments`);
    const json = await res.json();
    return res.status === 401 && Array.isArray(json.errors);
  });

  // --- Test 5: Role-Based Authorization Enforcement ---
  await assert('5.1 RBAC: Employee cannot access Manager Approvals queue (403 Forbidden)', async () => {
    // Login as employee
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'emp.eng.1@seed.finsight.internal',
        password: 'Password123!',
      }),
    });
    const { data } = await loginRes.json();
    const approvalsRes = await fetch(`${BACKEND_URL}/approvals/pending`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    return approvalsRes.status === 403;
  });

  await assert('5.2 RBAC: Department Manager CAN access Manager Approvals queue (200 OK)', async () => {
    // Login as manager
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.engineering@seed.finsight.internal',
        password: 'Password123!',
      }),
    });
    const { data } = await loginRes.json();
    const approvalsRes = await fetch(`${BACKEND_URL}/approvals/pending`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    return approvalsRes.status === 200;
  });

  await assert('5.3 RBAC: Manager cannot access Admin User Management (403 Forbidden)', async () => {
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.engineering@seed.finsight.internal',
        password: 'Password123!',
      }),
    });
    const { data } = await loginRes.json();
    const usersRes = await fetch(`${BACKEND_URL}/users`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    return usersRes.status === 403;
  });

  await assert('5.4 RBAC: System Admin CAN access Admin User Management (200 OK)', async () => {
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@finsight.com', password: 'admin123' }),
    });
    const { data } = await loginRes.json();
    const usersRes = await fetch(`${BACKEND_URL}/users`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    return usersRes.status === 200;
  });

  // --- Test 6: Successful Refresh Token Rotation ---
  let freshTokenPair: { accessToken: string; refreshToken: string };
  await assert('6. Refresh Token Rotation: returns new accessToken & refreshToken pair', async () => {
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@finsight.com', password: 'admin123' }),
    });
    const { data } = await loginRes.json();

    // Delay 1.1s so JWT iat increments by 1 second for rotation verification
    await new Promise((r) => setTimeout(r, 1100));

    const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: data.refreshToken }),
    });
    const refreshData = await refreshRes.json();
    freshTokenPair = refreshData.data;
    return (
      refreshRes.status === 201 &&
      !!freshTokenPair.accessToken &&
      !!freshTokenPair.refreshToken &&
      freshTokenPair.refreshToken !== data.refreshToken
    );
  });

  // --- Test 7: Expired or Invalid Refresh Token ---
  await assert('7. Invalid Refresh Token: malformed token returns 401 Invalid token', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'not.a.valid.jwt.token' }),
    });
    const json = await res.json();
    return (
      res.status === 401 &&
      Array.isArray(json.errors) &&
      json.errors[0].message === 'Invalid token.'
    );
  });

  // --- Test 8: Logout Flow ---
  await assert('8. Logout: revokes all active refresh tokens for the user in database', async () => {
    // Perform logout with valid accessToken
    const logoutRes = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshTokenPair.accessToken}`,
      },
    });

    if (logoutRes.status !== 201 && logoutRes.status !== 204 && logoutRes.status !== 200) {
      return false;
    }

    // Now attempt to use the previous refresh token; should be rejected since DB record was deleted
    const staleRefreshRes = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: freshTokenPair.refreshToken }),
    });
    return staleRefreshRes.status === 401;
  });

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runValidationSuite();
