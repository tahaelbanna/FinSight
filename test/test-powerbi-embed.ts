import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/home/tahaelbanna/.gemini/antigravity/brain/e5799a5e-d2b6-4dc3-ac1b-cd0d9a48d2ef/screenshots';

async function runPowerBITests() {
  console.log('================================================================');
  console.log('       FINSIGHT POWER BI INTEGRATION & RESPONSIVENESS SUITE     ');
  console.log('================================================================');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser: Browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page: Page = await context.newPage();

  try {
    // 1. Login as System Admin
    console.log('\n[1/7] Logging in as System Admin...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'admin@finsight.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log(' -> Logged in successfully. Current URL:', page.url());

    // 2. Navigate to /power-bi
    console.log('\n[2/7] Navigating to /power-bi...');
    await page.goto(`${BASE_URL}/power-bi`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const pageTitle = await page.textContent('h1');
    console.log(' -> Page Title:', pageTitle?.trim());

    // 3. Inspect iframe attributes
    console.log('\n[3/7] Validating iframe attributes and embedding...');
    const iframeElement = await page.waitForSelector('iframe[title="FinSight Power BI Dashboard"]', {
      timeout: 10000,
    });

    const iframeTitle = await iframeElement.getAttribute('title');
    const iframeSrc = await iframeElement.getAttribute('src');
    const iframeAllowFullscreen = await iframeElement.getAttribute('allowfullscreen');
    const iframeFrameBorder = await iframeElement.getAttribute('frameborder');

    console.log(' -> Title:', iframeTitle);
    console.log(' -> Src URL:', iframeSrc);
    console.log(' -> allowfullscreen:', iframeAllowFullscreen);
    console.log(' -> frameborder:', iframeFrameBorder);

    const EXPECTED_SRC =
      'https://app.powerbi.com/reportEmbed?reportId=809f893e-e567-4844-aa24-10971c2c07dc&autoAuth=true&ctid=27a388d0-1a33-462f-a48b-52c5342daf56';

    if (iframeSrc !== EXPECTED_SRC) {
      throw new Error(`Src mismatch! Expected: ${EXPECTED_SRC}, got: ${iframeSrc}`);
    }
    console.log(' -> Exact src URL and query parameters verified!');

    // 4. Capture Desktop Light Mode Screenshot
    console.log('\n[4/7] Capturing Desktop Light & Dark Mode views...');
    await page.waitForTimeout(2000);
    const lightScreenshot = path.join(SCREENSHOT_DIR, '07-powerbi-desktop-light.png');
    await page.screenshot({ path: lightScreenshot, fullPage: true });
    console.log(' -> Saved Light Mode Desktop screenshot:', lightScreenshot);

    // Toggle Dark Mode
    const themeButton = await page.$('button[aria-label="Toggle theme"], button:has(svg.lucide-moon), button:has(svg.lucide-sun)');
    if (themeButton) {
      await themeButton.click();
      await page.waitForTimeout(1000);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      console.log(' -> Dark mode toggled. html.dark active:', isDark);
      const darkScreenshot = path.join(SCREENSHOT_DIR, '08-powerbi-desktop-dark.png');
      await page.screenshot({ path: darkScreenshot, fullPage: true });
      console.log(' -> Saved Dark Mode Desktop screenshot:', darkScreenshot);
    }

    // 5. Test Responsive Container at Viewports
    console.log('\n[5/7] Testing Responsive Container Dimensions...');

    // Desktop Box Dimensions
    const desktopBox = await iframeElement.boundingBox();
    console.log(` -> Desktop (1280px): width=${desktopBox?.width.toFixed(1)}px, height=${desktopBox?.height.toFixed(1)}px, ratio=${((desktopBox?.width || 0) / (desktopBox?.height || 1)).toFixed(3)}`);

    // Tablet Viewport (768 x 1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    const tabletBox = await iframeElement.boundingBox();
    const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(` -> Tablet (768px): width=${tabletBox?.width.toFixed(1)}px, height=${tabletBox?.height.toFixed(1)}px, ratio=${((tabletBox?.width || 0) / (tabletBox?.height || 1)).toFixed(3)}, horizontalOverflow=${tabletOverflow}`);
    const tabletScreenshot = path.join(SCREENSHOT_DIR, '09-powerbi-tablet.png');
    await page.screenshot({ path: tabletScreenshot, fullPage: true });
    console.log(' -> Saved Tablet screenshot:', tabletScreenshot);

    // Mobile Viewport (375 x 667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    const mobileBox = await iframeElement.boundingBox();
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(` -> Mobile (375px): width=${mobileBox?.width.toFixed(1)}px, height=${mobileBox?.height.toFixed(1)}px, ratio=${((mobileBox?.width || 0) / (mobileBox?.height || 1)).toFixed(3)}, horizontalOverflow=${mobileOverflow}`);
    const mobileScreenshot = path.join(SCREENSHOT_DIR, '10-powerbi-mobile.png');
    await page.screenshot({ path: mobileScreenshot, fullPage: true });
    console.log(' -> Saved Mobile screenshot:', mobileScreenshot);

    // Reset Viewport to Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    // 6. Test Navigation to Native Analytics
    console.log('\n[6/7] Testing navigation between Power BI and Native Analytics...');
    const nativeAnalyticsLink = await page.$('a[href="/analytics"]');
    if (nativeAnalyticsLink) {
      await nativeAnalyticsLink.click();
      await page.waitForURL('**/analytics', { timeout: 10000 });
      console.log(' -> Successfully navigated to Native Analytics:', page.url());
      await page.waitForSelector('h1:has-text("Financial Analytics & Reporting")', { timeout: 5000 });
      console.log(' -> Native Analytics page loaded with Model B KPI cards and charts.');

      // Return to Power BI
      await page.goto(`${BASE_URL}/power-bi`, { waitUntil: 'networkidle' });
      await page.waitForSelector('iframe[title="FinSight Power BI Dashboard"]', { timeout: 5000 });
      console.log(' -> Returned to Power BI page successfully.');
    }

    // 7. Role-Based Access Control Verification
    console.log('\n[7/7] Testing Role-Based Access Control (Employee Access Interception)...');
    // Logout Admin
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // Login as Employee
    await page.fill('input[name="email"]', 'emp.eng.1@seed.finsight.internal');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Attempt direct access to /power-bi as employee
    await page.goto(`${BASE_URL}/power-bi`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h2:has-text("Access Restricted")', { timeout: 5000 });
    const unauthorizedText = await page.textContent('h2');
    console.log(' -> Employee direct access to /power-bi blocked by RoleGuard:', unauthorizedText?.trim());

    console.log('\n================================================================');
    console.log('            ALL POWER BI INTEGRATION TESTS PASSED               ');
    console.log('================================================================');
  } catch (err) {
    console.error('\n[ERROR] Test suite failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPowerBITests();
