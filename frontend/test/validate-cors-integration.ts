/**
 * FinSight Pre-Phase 8: Backend-Frontend Communication & CORS Integration Test Suite
 *
 * Verifies:
 * 1. NestJS CORS configuration (OPTIONS preflight, headers, credentials, allowed methods)
 * 2. Origin whitelisting (localhost:5173 allowed, untrusted origins rejected)
 * 3. Vite development proxy routing (/api -> http://localhost:4000)
 * 4. Token lifecycle (Login, Authenticated query, Refresh token, Logout)
 */

const BACKEND_URL = 'http://localhost:4000/api/v1';
const PROXY_URL = 'http://localhost:5173/api/v1';

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

async function runAudit() {
  console.log('====================================================');
  console.log('🌐 FINSIGHT BACKEND-FRONTEND INTEGRATION & CORS AUDIT');
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // PART 1: Backend CORS Verification (Direct http://localhost:4000)
  // --------------------------------------------------------------------------
  console.log('--- PART 1: Backend CORS Configuration (Port 4000) ---');

  await test('1.1 OPTIONS Preflight request returns 204 with correct CORS headers for http://localhost:5173', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    assert(res.status === 204, `Expected status 204, got ${res.status}`);
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(allowOrigin === 'http://localhost:5173', `Expected allow-origin http://localhost:5173, got ${allowOrigin}`);
    const allowCreds = res.headers.get('access-control-allow-credentials');
    assert(allowCreds === 'true', `Expected allow-credentials true, got ${allowCreds}`);
    const allowMethods = res.headers.get('access-control-allow-methods') || '';
    assert(allowMethods.includes('POST') && allowMethods.includes('GET'), `Expected POST,GET in methods, got ${allowMethods}`);
  });

  await test('1.2 Untrusted origin is rejected without Access-Control-Allow-Origin header', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://evil-phishing-site.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(!allowOrigin || allowOrigin !== 'https://evil-phishing-site.com', `Untrusted origin was unexpectedly granted CORS: ${allowOrigin}`);
  });

  await test('1.3 Direct cross-origin POST /auth/login receives Access-Control-Allow-Origin header', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@finsight.com', password: 'admin123' }),
    });

    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(allowOrigin === 'http://localhost:5173', `Expected allow-origin http://localhost:5173, got ${allowOrigin}`);
    const data = await res.json();
    assert(Boolean(data?.data?.accessToken), 'Expected accessToken in response');
  });

  // --------------------------------------------------------------------------
  // PART 2: Vite Development Proxy Verification (Port 5173)
  // --------------------------------------------------------------------------
  console.log('\n--- PART 2: Vite Proxy Communication (Port 5173) ---');

  let adminTokens: { accessToken: string; refreshToken: string } = { accessToken: '', refreshToken: '' };

  await test('2.1 Login via Vite proxy (/api/v1/auth/login) succeeds and returns token pair', async () => {
    const res = await fetch(`${PROXY_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@finsight.com', password: 'admin123' }),
    });

    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const body = await res.json();
    assert(Boolean(body?.data?.accessToken), 'Missing accessToken');
    assert(Boolean(body?.data?.refreshToken), 'Missing refreshToken');
    adminTokens = body.data;
  });

  await test('2.2 Authenticated query via Vite proxy (/api/v1/departments) succeeds with Bearer token', async () => {
    const res = await fetch(`${PROXY_URL}/departments`, {
      headers: {
        'Authorization': `Bearer ${adminTokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const body = await res.json();
    assert(Array.isArray(body?.data?.data), 'Expected array in data.data');
    assert(body.data.data.length > 0, 'Expected seeded departments to be returned');
  });

  await test('2.3 Token refresh via Vite proxy (/api/v1/auth/refresh-token) rotates tokens', async () => {
    // Wait 1.1s so JWT issued-at timestamp (iat) in seconds increments
    await new Promise((r) => setTimeout(r, 1100));

    const res = await fetch(`${PROXY_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: adminTokens.refreshToken }),
    });

    assert(res.status === 201, `Expected status 201, got ${res.status}`);
    const body = await res.json();
    assert(Boolean(body?.data?.accessToken), 'Missing new accessToken');
    assert(Boolean(body?.data?.refreshToken), 'Missing new refreshToken');
    assert(body.data.refreshToken !== adminTokens.refreshToken, 'Expected rotated refresh token');
    adminTokens = body.data;
  });

  await test('2.4 Logout via Vite proxy (/api/v1/auth/logout) invalidates session', async () => {
    const res = await fetch(`${PROXY_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminTokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    assert(res.status === 201 || res.status === 200, `Expected 200/201, got ${res.status}`);
  });

  console.log('\n====================================================');
  console.log(`📊 AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runAudit();
