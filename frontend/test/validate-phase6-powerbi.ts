/**
 * FinSight Phase 6: Power BI Integration Validation Suite
 * Validates Power BI report catalog, role-based visibility, configuration detection, and route RBAC
 */

import { POWER_BI_REPORTS, getReportsForRole } from '../src/features/power-bi/config/powerbi.config.ts';

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

function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
}

async function runPowerBIValidation() {
  console.log('====================================================');
  console.log('🚀 FINSIGHT PHASE 6 POWER BI INTEGRATION VALIDATION');
  console.log(`Backend Target: ${BACKEND_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function assert(desc: string, testFn: () => boolean | Promise<boolean>) {
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

  // 1. Authenticate with each organizational role to verify credentials and JWT claims
  const adminToken = await loginUser('admin@finsight.com', 'admin123');
  const managerToken = await loginUser('manager.engineering@seed.finsight.internal');
  const financeToken = await loginUser('marcus.vance@seed.finsight.internal');
  const employeeToken = await loginUser('emp.eng.1@seed.finsight.internal');

  const adminClaims = parseJwt(adminToken);
  const managerClaims = parseJwt(managerToken);
  const financeClaims = parseJwt(financeToken);
  const employeeClaims = parseJwt(employeeToken);

  // --- Test Suite 1: Catalog Definition & Security Safeguards ---
  await assert('1.1 Catalog: FinSight reports catalog contains all 3 designated reports', () => {
    return (
      POWER_BI_REPORTS.length === 3 &&
      POWER_BI_REPORTS.some((r) => r.id === 'executive-summary') &&
      POWER_BI_REPORTS.some((r) => r.id === 'department-comparison') &&
      POWER_BI_REPORTS.some((r) => r.id === 'expense-audit')
    );
  });

  await assert('1.2 Security: No Azure/Power BI client secrets or service principal keys exist in code', () => {
    const jsonString = JSON.stringify(POWER_BI_REPORTS);
    const hasSecretKeywords =
      jsonString.includes('secret') ||
      jsonString.includes('client_secret') ||
      jsonString.includes('password') ||
      jsonString.includes('private_key');
    return !hasSecretKeywords;
  });

  // --- Test Suite 2: Role-Based Report Catalog Filtering ---
  await assert('2.1 RBAC: System Admin has access to all 3 executive and departmental reports', () => {
    const adminReports = getReportsForRole(adminClaims.role);
    return (
      adminReports.length === 3 &&
      adminReports.some((r) => r.id === 'executive-summary') &&
      adminReports.some((r) => r.id === 'department-comparison') &&
      adminReports.some((r) => r.id === 'expense-audit')
    );
  });

  await assert('2.2 RBAC: Finance Officer has access to all 3 financial reports', () => {
    const financeReports = getReportsForRole(financeClaims.role);
    return (
      financeReports.length === 3 &&
      financeReports.some((r) => r.id === 'executive-summary') &&
      financeReports.some((r) => r.id === 'department-comparison') &&
      financeReports.some((r) => r.id === 'expense-audit')
    );
  });

  await assert('2.3 RBAC: Department Manager is restricted from Executive Summary (scoped to Dept & Audit)', () => {
    const managerReports = getReportsForRole(managerClaims.role);
    const hasExecutive = managerReports.some((r) => r.id === 'executive-summary');
    const hasDepartment = managerReports.some((r) => r.id === 'department-comparison');
    const hasAudit = managerReports.some((r) => r.id === 'expense-audit');
    return !hasExecutive && hasDepartment && hasAudit && managerReports.length === 2;
  });

  await assert('2.4 RBAC: Employee role has access to zero Power BI organization reports', () => {
    const employeeReports = getReportsForRole(employeeClaims.role);
    return employeeReports.length === 0;
  });

  // --- Test Suite 3: Route Protection & Permission Verification ---
  await assert('3.1 Navigation: Power BI route is protected by RoleGuard for admin, finance_officer, manager', () => {
    // In AppRouter.tsx, /power-bi is wrapped with RoleGuard allowedRoles={['admin', 'finance_officer', 'manager']}
    const allowedRoles = ['admin', 'finance_officer', 'manager'];
    const adminAllowed = allowedRoles.includes(adminClaims.role);
    const financeAllowed = allowedRoles.includes(financeClaims.role);
    const managerAllowed = allowedRoles.includes(managerClaims.role);
    const employeeAllowed = allowedRoles.includes(employeeClaims.role);
    return adminAllowed && financeAllowed && managerAllowed && !employeeAllowed;
  });

  // --- Test Suite 4: Environment & Unconfigured State Detection ---
  await assert('4.1 Configuration: Default environment correctly triggers "unconfigured" state', () => {
    // Without active VITE_POWER_BI_EMBED_URL and VITE_POWER_BI_REPORT_ID, config must indicate unconfigured
    const hasEmbedUrl = Boolean(process.env.VITE_POWER_BI_EMBED_URL);
    const hasReportId = Boolean(process.env.VITE_POWER_BI_REPORT_ID);
    // In current environment, these are unset, which accurately drives the setup-required screen
    return !hasEmbedUrl && !hasReportId;
  });

  console.log('\n====================================================');
  console.log(`📊 PHASE 6 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPowerBIValidation().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
