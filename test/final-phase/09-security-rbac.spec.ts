interface TestResult {
    id: string;
    description: string;
    passed: boolean;
    error?: string;
}

const API_BASE = 'http://localhost:4000/api/v1';

async function loginUser(email: string, password = 'password123'): Promise<string> {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        throw new Error(`Login failed for ${email}: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return json.data?.accessToken || json.accessToken;
}

export async function runSecurityRbacTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

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
    console.log('SUB-PHASE 9: SECURITY & ROLE-BASED ACCESS CONTROL (RBAC) TESTING');
    console.log('===============================================================');

    // 1. Authenticate all 4 roles
    const adminToken = await loginUser('admin@finsight.com', 'admin123');
    const foToken = await loginUser('marcus.vance@seed.finsight.internal', 'Password123!');
    const mgrToken = await loginUser('manager.engineering@seed.finsight.internal', 'Password123!');
    const empToken = await loginUser('emp.eng.1@seed.finsight.internal', 'Password123!');

    // --- 9.1 AUTHENTICATION GUARDS (UNAUTHENTICATED ACCESS) ---
    console.log('\n--- 9.1 Authentication Guards ---');
    
    // Unauthenticated GET /departments returns 401
    const unauthDept = await fetch(`${API_BASE}/departments`);
    assert('9.1.1', 'Unauthenticated request to /departments returns 401 Unauthorized', unauthDept.status === 401);

    // Unauthenticated GET /expenses returns 401
    const unauthExp = await fetch(`${API_BASE}/expenses`);
    assert('9.1.2', 'Unauthenticated request to /expenses returns 401 Unauthorized', unauthExp.status === 401);

    // Malformed token returns 401
    const malformedTokenRes = await fetch(`${API_BASE}/departments`, {
        headers: { Authorization: 'Bearer totally-invalid-jwt-token' }
    });
    assert('9.1.3', 'Malformed Bearer token returns 401 Unauthorized', malformedTokenRes.status === 401);

    // --- 9.2 EMPLOYEE ROLE BOUNDARY & NEGATIVE TESTS ---
    console.log('\n--- 9.2 Employee Role Boundary & Negative Tests ---');

    // Employee cannot access Approvals queue (403 Forbidden)
    const empApprovals = await fetch(`${API_BASE}/approvals/pending`, {
        headers: { Authorization: `Bearer ${empToken}` }
    });
    assert('9.2.1', 'Employee is forbidden from accessing /approvals/pending (403 Forbidden)', empApprovals.status === 403);

    // Employee cannot access Department Comparison (403 Forbidden)
    const empDeptComp = await fetch(`${API_BASE}/analytics/department-comparison`, {
        headers: { Authorization: `Bearer ${empToken}` }
    });
    assert('9.2.2', 'Employee is forbidden from accessing /analytics/department-comparison (403 Forbidden)', empDeptComp.status === 403);

    // Employee cannot access Project Performance (403 Forbidden)
    const empProjPerf = await fetch(`${API_BASE}/analytics/project-performance`, {
        headers: { Authorization: `Bearer ${empToken}` }
    });
    assert('9.2.3', 'Employee is forbidden from accessing /analytics/project-performance (403 Forbidden)', empProjPerf.status === 403);

    // Employee cannot access User Management (403 Forbidden)
    const empUsers = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${empToken}` }
    });
    assert('9.2.4', 'Employee is forbidden from accessing /users (403 Forbidden)', empUsers.status === 403);

    // Employee cannot access Activity Logs (403 Forbidden)
    const empLogs = await fetch(`${API_BASE}/activity-logs`, {
        headers: { Authorization: `Bearer ${empToken}` }
    });
    assert('9.2.5', 'Employee is forbidden from accessing /activity-logs (403 Forbidden)', empLogs.status === 403);

    // Employee cannot create a Budget (403 Forbidden)
    const empCreateBudget = await fetch(`${API_BASE}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
        body: JSON.stringify({ department_id: 1, allocated_amount: 50000, start_date: '2025-01-01', end_date: '2025-12-31' }),
    });
    assert('9.2.6', 'Employee is forbidden from creating a Budget (403 Forbidden)', empCreateBudget.status === 403);

    // --- 9.3 MANAGER ROLE SCOPING & BOUNDARY TESTS ---
    console.log('\n--- 9.3 Department Manager Scoping & Boundary Tests ---');

    // Manager CAN access pending approvals queue (200 OK)
    const mgrApprovals = await fetch(`${API_BASE}/approvals/pending`, {
        headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert('9.3.1', 'Manager has access to /approvals/pending (200 OK)', mgrApprovals.status === 200);

    // Manager CAN access Department Comparison (200 OK), but scoped strictly to own department (1 department returned)
    const mgrDeptComp = await fetch(`${API_BASE}/analytics/department-comparison`, {
        headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const mgrDeptJson = await mgrDeptComp.json();
    const mgrDeptData = Array.isArray(mgrDeptJson) ? mgrDeptJson : (mgrDeptJson.data || []);
    assert('9.3.2', 'Manager department comparison is automatically scoped to managed department (1 record returned)', 
        mgrDeptComp.status === 200 && Array.isArray(mgrDeptData) && mgrDeptData.length === 1 && String(mgrDeptData[0].department.department_id) === '1'
    );

    // Manager CANNOT access User Management (403 Forbidden)
    const mgrUsers = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${mgrToken}` }
    });
    assert('9.3.3', 'Manager is forbidden from accessing User Management /users (403 Forbidden)', mgrUsers.status === 403);

    // --- 9.4 FINANCE OFFICER ROLE BOUNDARY TESTS ---
    console.log('\n--- 9.4 Finance Officer Role Boundary Tests ---');

    // Finance Officer CAN access organization-wide department comparison (6 departments returned)
    const foDeptComp = await fetch(`${API_BASE}/analytics/department-comparison`, {
        headers: { Authorization: `Bearer ${foToken}` }
    });
    const foDeptJson = await foDeptComp.json();
    const foDeptData = Array.isArray(foDeptJson) ? foDeptJson : (foDeptJson.data || []);
    assert('9.4.1', 'Finance Officer receives organization-wide department comparison (all 6 departments)', 
        foDeptComp.status === 200 && Array.isArray(foDeptData) && foDeptData.length === 6
    );

    // Finance Officer CANNOT access User Management (403 Forbidden)
    const foUsers = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${foToken}` }
    });
    assert('9.4.2', 'Finance Officer is forbidden from accessing /users (403 Forbidden)', foUsers.status === 403);

    // --- 9.5 SYSTEM ADMIN ROLE BOUNDARY TESTS ---
    console.log('\n--- 9.5 System Admin Full Privileges ---');

    // Admin CAN access User Management (200 OK)
    const adminUsers = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('9.5.1', 'System Admin has access to /users (200 OK)', adminUsers.status === 200);

    // Admin CAN access Activity Logs (200 OK)
    const adminLogs = await fetch(`${API_BASE}/activity-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('9.5.2', 'System Admin has access to /activity-logs (200 OK)', adminLogs.status === 200);

    return results;
}

if (require.main === module) {
    runSecurityRbacTests()
        .then(results => {
            const failed = results.filter(r => !r.passed);
            console.log(`\nSUB-PHASE 9 SUMMARY: ${results.length - failed.length}/${results.length} PASSED (Failed: ${failed.length})`);
            if (failed.length > 0) process.exit(1);
        })
        .catch(err => {
            console.error('Fatal in Sub-Phase 9:', err);
            process.exit(1);
        });
}
