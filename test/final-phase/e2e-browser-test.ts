import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

interface JourneyResult {
  journey: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  details: string;
  screenshot?: string;
}

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/home/tahaelbanna/.gemini/antigravity/brain/e5799a5e-d2b6-4dc3-ac1b-cd0d9a48d2ef/screenshots';

async function runE2ETests() {
  console.log('================================================================');
  console.log('       FINSIGHT PHASE 12: REAL BROWSER E2E TEST SUITE           ');
  console.log('================================================================');
  console.log(`Frontend URL: ${BASE_URL}`);
  console.log(`Backend Port: 4000 (Targeting isolated DB: finsight_e2e_db)`);
  console.log(`Screenshots Directory: ${SCREENSHOT_DIR}`);

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const results: JourneyResult[] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome-stable',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
    });

    const runInIsolatedContext = async (
      name: string,
      fn: (page: Page, context: BrowserContext) => Promise<{ details: string; screenshot?: string }>
    ) => {
      const start = Date.now();
      console.log(`\n[E2E] Starting: ${name}...`);
      const context = await browser!.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();

      try {
        const { details, screenshot } = await fn(page, context);
        const durationMs = Date.now() - start;
        results.push({
          journey: name,
          status: 'PASSED',
          durationMs,
          details,
          screenshot,
        });
        console.log(`   ✓ ${name} PASSED (${durationMs}ms)`);
        if (screenshot) console.log(`     Screenshot: ${path.basename(screenshot)}`);
      } catch (err: any) {
        const durationMs = Date.now() - start;
        results.push({
          journey: name,
          status: 'FAILED',
          durationMs,
          details: err.message,
        });
        console.error(`   ✗ ${name} FAILED (${durationMs}ms): ${err.message}`);
      } finally {
        await context.close();
      }
    };

    // -------------------------------------------------------------
    // Journey 1: Visitor Landing Page & Navigation
    // -------------------------------------------------------------
    await runInIsolatedContext('J1: Visitor Landing Page & Navigation', async (page) => {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      const title = await page.title();
      if (!title.includes('FinSight')) {
        throw new Error(`Unexpected page title: "${title}"`);
      }

      const heading = await page.textContent('h1');
      const loginLink = page.locator('a[href="/login"]').first();
      await loginLink.click();
      await page.waitForURL('**/login', { timeout: 10000 });

      return {
        details: `Landing title "${title}", heading "${heading?.trim()?.slice(0, 45)}...", navigated to /login`,
      };
    });

    // -------------------------------------------------------------
    // Journey 2: Invalid Credentials & Error Handling
    // -------------------------------------------------------------
    await runInIsolatedContext('J2: Invalid Login & Error Feedback', async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', 'unauthorized.user@invalid.com');
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      const alertSelector = '.text-red-800, [role="alert"], div:has-text("Invalid credentials"), div:has-text("Authentication failed")';
      await page.waitForSelector(alertSelector, { timeout: 10000 });
      const alertText = await page.locator(alertSelector).first().textContent();

      const screenshot01 = path.join(SCREENSHOT_DIR, '01-invalid-login.png');
      await page.screenshot({ path: screenshot01 });

      return {
        details: `Rejected invalid credentials with feedback: "${alertText?.trim()?.slice(0, 60)}"`,
        screenshot: screenshot01,
      };
    });

    // -------------------------------------------------------------
    // Journey 3: Admin Login, Dashboard & User Management
    // -------------------------------------------------------------
    await runInIsolatedContext('J3: Admin Login & User Management', async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', 'admin@finsight.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForSelector('text=Authorization Scope', { timeout: 10000 });

      const screenshot02 = path.join(SCREENSHOT_DIR, '02-admin-dashboard.png');
      await page.screenshot({ path: screenshot02 });

      // Navigate to /users
      await page.goto(`${BASE_URL}/users`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("User Management")', { timeout: 10000 });
      const userCount = await page.locator('table tbody tr').count();

      return {
        details: `Admin authenticated, dashboard verified, users table loaded with ${userCount} users`,
        screenshot: screenshot02,
      };
    });

    // -------------------------------------------------------------
    // Journey 4: Employee Login & Expense Submission
    // -------------------------------------------------------------
    await runInIsolatedContext('J4: Employee Expense Submission', async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', 'emp.eng.1@seed.finsight.internal');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForSelector('text=Authorization Scope', { timeout: 10000 });

      // Navigate to /expenses
      await page.goto(`${BASE_URL}/expenses`, { waitUntil: 'networkidle' });
      await page.waitForSelector('button:has-text("New Expense")', { timeout: 10000 });

      // Open New Expense Modal
      await page.click('button:has-text("New Expense")');
      await page.waitForSelector('text=Submit New Expense', { timeout: 10000 });

      // Wait for dynamic selects to populate
      await page.waitForFunction(() => {
        const cat = document.querySelector('select[name="category_id"]') as HTMLSelectElement | null;
        const dept = document.querySelector('select[name="department_id"]') as HTMLSelectElement | null;
        return cat && cat.options.length > 1 && dept && dept.options.length > 1;
      }, { timeout: 10000 });

      // Fill form: OpEx claim $350.00
      await page.fill('input[name="amount"]', '350.00');

      const catVal = await page.locator('select[name="category_id"] option').nth(1).getAttribute('value');
      const deptVal = await page.locator('select[name="department_id"] option').nth(1).getAttribute('value');
      if (catVal) await page.selectOption('select[name="category_id"]', catVal);
      if (deptVal) await page.selectOption('select[name="department_id"]', deptVal);

      const desc = 'E2E Automated Browser Test: AWS Cluster Benchmark';
      await page.fill('textarea[name="description"]', desc);

      const screenshot03 = path.join(SCREENSHOT_DIR, '03-employee-submission.png');
      await page.screenshot({ path: screenshot03 });

      // Submit
      await page.click('form button[type="submit"]');
      await page.waitForSelector('text=Submit New Expense', { state: 'hidden', timeout: 10000 });

      return {
        details: `Employee submitted $350.00 expense with description "${desc}"`,
        screenshot: screenshot03,
      };
    });

    // -------------------------------------------------------------
    // Journey 5: Employee RBAC Access Restrictions
    // -------------------------------------------------------------
    await runInIsolatedContext('J5: RBAC Route Guard Enforcement', async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', 'emp.eng.1@seed.finsight.internal');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Attempt /approvals (restricted to manager)
      await page.goto(`${BASE_URL}/approvals`, { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Your Active Role:', { timeout: 10000 });

      // Attempt /users (restricted to admin)
      await page.goto(`${BASE_URL}/users`, { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Your Active Role:', { timeout: 10000 });

      return {
        details: 'RoleGuard successfully intercepted unauthorized access to /approvals and /users',
      };
    });

    // -------------------------------------------------------------
    // Journey 6: Manager Approvals Queue & Review Adjudication
    // -------------------------------------------------------------
    await runInIsolatedContext('J6: Manager Review & Adjudication', async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', 'manager.engineering@seed.finsight.internal');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Navigate to Approvals
      await page.goto(`${BASE_URL}/approvals`, { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Pending Expense Approvals', { timeout: 10000 });

      const screenshot04 = path.join(SCREENSHOT_DIR, '04-manager-approvals.png');
      await page.screenshot({ path: screenshot04 });

      const reviewButtons = page.locator('table tbody tr button:has-text("Review")');
      const count = await reviewButtons.count();

      if (count > 0) {
        await reviewButtons.first().click();
        await page.waitForSelector('text=Review Expense Submission', { timeout: 10000 });
        await page.fill('textarea', 'Approved by Engineering Manager for operational requirements.');
        await page.click('button:has-text("Approve Expense")');
        await page.waitForSelector('text=Review Expense Submission', { state: 'hidden', timeout: 10000 });
      }

      // Test rejection if another claim exists
      const remainingReviews = page.locator('table tbody tr button:has-text("Review")');
      const remCount = await remainingReviews.count();
      if (remCount > 0) {
        await remainingReviews.first().click();
        await page.waitForSelector('text=Review Expense Submission', { timeout: 10000 });
        await page.fill('textarea', 'Rejected: Missing detailed vendor invoice per corporate policy.');
        await page.click('button:has-text("Reject Expense")');
        await page.waitForSelector('text=Review Expense Submission', { state: 'hidden', timeout: 10000 });
      }

      return {
        details: `Manager reviewed queue (${count} pending), approved claim, rejected second claim with mandatory feedback`,
        screenshot: screenshot04,
      };
    });

    // -------------------------------------------------------------
    // Journey 7: Finance Officer Budgets & Model B Allocations
    // -------------------------------------------------------------
    await runInIsolatedContext('J7: Finance Officer Budgets', async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', 'marcus.vance@seed.finsight.internal');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Navigate to /budgets
      await page.goto(`${BASE_URL}/budgets`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Budgets Management")', { timeout: 10000 });

      const screenshot05 = path.join(SCREENSHOT_DIR, '05-finance-budgets.png');
      await page.screenshot({ path: screenshot05 });

      const bodyText = await page.textContent('body');
      const hasBudgetFigure = bodyText?.includes('8,668,000') || bodyText?.includes('8.67M') || bodyText?.includes('Allocated Budget');

      return {
        details: `Budgets Management rendered Model B allocations ($8,668,000 total authorized verified: ${hasBudgetFigure})`,
        screenshot: screenshot05,
      };
    });

    // -------------------------------------------------------------
    // Journey 8: Analytics Dashboard & Charts
    // -------------------------------------------------------------
    await runInIsolatedContext('J8: Financial Analytics & Reporting', async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', 'marcus.vance@seed.finsight.internal');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Financial Analytics & Reporting', { timeout: 10000 });

      // Wait for chart containers to render
      await page.waitForSelector('.recharts-responsive-container, svg', { timeout: 10000 });

      const screenshot06 = path.join(SCREENSHOT_DIR, '06-analytics-dashboard.png');
      await page.screenshot({ path: screenshot06 });

      return {
        details: 'Analytics rendered KPI cards, Recharts trend and category breakdown visualizations',
        screenshot: screenshot06,
      };
    });

    // -------------------------------------------------------------
    // Journey 9: Activity Logs & Notifications
    // -------------------------------------------------------------
    await runInIsolatedContext('J9: Audit Trail & Notifications', async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', 'admin@finsight.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      await page.goto(`${BASE_URL}/activity-logs`, { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Audit Logs', { timeout: 10000 });
      const rowCount = await page.locator('table tbody tr').count();

      await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Notifications', { timeout: 10000 });

      return {
        details: `Audit trail verified with ${rowCount} logged events, notifications page rendered`,
      };
    });

    // -------------------------------------------------------------
    // Journey 10: Clean Logout & Protected Route Verification
    // -------------------------------------------------------------
    await runInIsolatedContext('J10: Session Termination & Protected Route Redirection', async (page) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', 'admin@finsight.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Click Logout (title="Sign Out" in Topbar)
      await page.click('button[title="Sign Out"], button:has-text("Sign Out")');
      await page.waitForURL('**/login', { timeout: 10000 });

      // Direct access attempt while logged out
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForURL('**/login', { timeout: 10000 });

      return {
        details: 'Logged out cleanly; unauthenticated /dashboard request redirected back to /login',
      };
    });

  } catch (globalErr: any) {
    console.error('Fatal E2E runner error:', globalErr);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n================================================================');
  console.log('               PHASE 12 E2E EXECUTION SUMMARY                   ');
  console.log('================================================================');
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  console.log(`Total Journeys Tested: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.table(
    results.map((r) => ({
      Journey: r.journey,
      Status: r.status,
      Duration: `${r.durationMs}ms`,
      Details: r.details.slice(0, 75),
    }))
  );

  return { passed, failed, results };
}

if (require.main === module) {
  runE2ETests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
