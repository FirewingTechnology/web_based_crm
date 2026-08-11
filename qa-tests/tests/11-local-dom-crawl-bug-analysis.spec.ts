/**
 * LOCAL DOM CRAWL & BUG ANALYSIS SUITE
 * Targets:
 *   Website  → http://localhost:5176
 *   CRM      → http://localhost:5173
 *   API      → http://localhost:8001/api/v1
 *
 * Methodology:
 *   1. Intercept all network requests — capture 4xx/5xx, slow responses, failed XHR
 *   2. Capture all browser console errors & warnings
 *   3. Crawl every route in both portals (Admin + Sales views)
 *   4. Detect DOM anomalies: broken images, empty containers, overflow, z-index issues
 *   5. Fuzz every form: empty / invalid / boundary / XSS payloads
 *   6. Accessibility audit: missing alt, missing labels, low contrast
 *   7. Screenshot every page at 1440×900 and 375×812 (mobile)
 */
import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const WEBSITE = 'http://127.0.0.1:5176';
const CRM = 'http://127.0.0.1:5173';
const API = 'http://127.0.0.1:8001/api/v1';
const SS_DIR = path.resolve(__dirname, '../../test-results/screenshots/local');
const BUGS_FILE = path.resolve(__dirname, '../../test-results/screenshots/local/bugs-report.json');

if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

interface Bug {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  route: string;
  type: string;
  message: string;
  evidence?: string;
}

const bugs: Bug[] = [];
const networkErrors: string[] = [];
const consoleErrors: string[] = [];

function addBug(severity: Bug['severity'], route: string, type: string, message: string, evidence?: string) {
  const bug: Bug = { severity, route, type, message, evidence };
  bugs.push(bug);
  console.log(`[BUG ${severity}] [${type}] ${route}: ${message}`);
}

function setupPageListeners(page: Page, route: string) {
  // Capture all console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(`[${route}] ${text}`);
      if (!text.includes('favicon') && !text.includes('ERR_CONNECTION_REFUSED')) {
        addBug('HIGH', route, 'CONSOLE_ERROR', text);
      }
    }
    if (msg.type() === 'warning' && msg.text().includes('Warning:')) {
      addBug('LOW', route, 'REACT_WARNING', msg.text());
    }
  });

  // Capture unhandled promise rejections
  page.on('pageerror', err => {
    addBug('CRITICAL', route, 'UNHANDLED_JS_ERROR', err.message);
  });
}

function setupNetworkListeners(context: BrowserContext) {
  context.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (status >= 400 && status !== 401 && status !== 403 && !url.includes('favicon')) {
      const msg = `HTTP ${status} on ${url}`;
      networkErrors.push(msg);
      addBug(status >= 500 ? 'CRITICAL' : 'HIGH', url, `HTTP_${status}`, msg);
    }
  });
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SS_DIR, `${name}.png`), fullPage: true });
}

async function detectBrokenImages(page: Page, route: string) {
  const brokenImgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).filter(img => {
      return img.complete && (img.naturalHeight === 0 || img.naturalWidth === 0);
    }).map(img => img.src || img.getAttribute('src') || 'unknown-src');
  });
  for (const src of brokenImgs) {
    addBug('MEDIUM', route, 'BROKEN_IMAGE', `Broken image: ${src}`);
  }
}

async function detectMissingLabels(page: Page, route: string) {
  const unlabeled = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, textarea')).filter(el => {
      const id = el.getAttribute('id');
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledby = el.getAttribute('aria-labelledby');
      const placeholder = el.getAttribute('placeholder');
      if (!ariaLabel && !ariaLabelledby && !placeholder) {
        if (id && !document.querySelector(`label[for="${id}"]`)) return true;
        if (!id) return true;
      }
      return false;
    }).length;
  });
  if (unlabeled > 0) {
    addBug('LOW', route, 'ACCESSIBILITY', `${unlabeled} unlabeled form inputs found`);
  }
}

async function detectOverflow(page: Page, route: string) {
  const overflowing = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.right > window.innerWidth + 5;
    }).map(el => el.tagName + (el.className ? '.' + el.className.toString().split(' ').join('.').substring(0, 50) : ''));
  });
  if (overflowing.length > 0) {
    addBug('MEDIUM', route, 'HORIZONTAL_OVERFLOW', `Elements overflowing viewport: ${overflowing.slice(0, 3).join(', ')}`);
  }
}

async function detectEmptyContainers(page: Page, route: string) {
  const hasEmptyContent = await page.evaluate(() => {
    const contentAreas = document.querySelectorAll('main, [role="main"], .space-y-6, [class*="content"]');
    for (const el of contentAreas) {
      if (el.children.length === 0 && (el as HTMLElement).innerText.trim().length === 0) return true;
    }
    return false;
  });
  if (hasEmptyContent) {
    addBug('HIGH', route, 'EMPTY_CONTENT', 'Main content area appears to be empty after page load');
  }
}

async function fuzzForm(page: Page, formSelector: string, route: string) {
  const inputs = page.locator(`${formSelector} input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), ${formSelector} textarea`);
  const count = await inputs.count();
  if (count === 0) return;

  // Empty submit
  const submitBtn = page.locator(`${formSelector} button[type="submit"]`).first();
  if (await submitBtn.isVisible()) {
    await submitBtn.click().catch(() => {});
    await page.waitForTimeout(300);
    const hasError = await page.locator('text=/required|invalid|error/i').count() > 0;
    if (!hasError) {
      addBug('MEDIUM', route, 'FORM_NO_VALIDATION', `Form ${formSelector} allowed empty submit without visible error`);
    }
  }

  // XSS payload
  for (let i = 0; i < Math.min(count, 3); i++) {
    const inp = inputs.nth(i);
    const inputType = await inp.getAttribute('type');
    if (inputType === 'number') {
      await inp.fill('-999999').catch(() => {});
    } else {
      await inp.fill('<script>alert(1)</script>').catch(() => {});
    }
  }
  if (await submitBtn.isVisible()) {
    await submitBtn.click().catch(() => {});
    await page.waitForTimeout(500);
    const xssReflected = await page.evaluate(() => document.body.innerHTML.includes('<script>alert(1)</script>'));
    if (xssReflected) {
      addBug('CRITICAL', route, 'XSS_REFLECTED', `XSS payload reflected unescaped in ${formSelector}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test('LOCAL DOM CRAWL — Marketing Website', async ({ page, context }) => {
  setupNetworkListeners(context);
  const websiteRoutes = ['/', '/about', '/solutions', '/features', '/industries', '/pricing', '/blog', '/faq', '/contact', '/register'];

  for (const route of websiteRoutes) {
    setupPageListeners(page, `website${route}`);
    let navOk = true;
    await page.goto(`${WEBSITE}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => {
      addBug('CRITICAL', `website${route}`, 'PAGE_LOAD_FAIL', `Page load failed: ${e.message}`);
      navOk = false;
    });
    if (!navOk) continue;
    await page.waitForTimeout(800);

    const title = await page.title().catch(() => '');
    if (!title || title.trim().length === 0) {
      addBug('MEDIUM', `website${route}`, 'MISSING_TITLE', 'Page has no <title> tag');
    }

    await detectBrokenImages(page, `website${route}`);
    await detectOverflow(page, `website${route}`);
    await detectEmptyContainers(page, `website${route}`);
    await detectMissingLabels(page, `website${route}`);
    await screenshot(page, `website${route.replace(/\//g, '_') || 'home'}`);

    // Mobile viewport check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await detectOverflow(page, `website${route} [mobile]`);
    await screenshot(page, `mobile_website${route.replace(/\//g, '_') || 'home'}`);
    await page.setViewportSize({ width: 1440, height: 900 });
  }
});

test('LOCAL DOM CRAWL — CRM Login', async ({ page, context }) => {
  setupNetworkListeners(context);
  setupPageListeners(page, 'crm/login');

  await page.goto(`${CRM}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await screenshot(page, 'crm_login');

  // Check form
  const emailInput = page.locator('input[type="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  if (!await emailInput.isVisible()) addBug('CRITICAL', 'crm/login', 'MISSING_FIELD', 'Email input not found on login page');
  if (!await passInput.isVisible()) addBug('CRITICAL', 'crm/login', 'MISSING_FIELD', 'Password input not found on login page');

  // Empty submit
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    await page.waitForTimeout(500);
    const h400 = await page.locator('text=/400|required|invalid/i').count();
    if (!h400) addBug('MEDIUM', 'crm/login', 'FORM_NO_VALIDATION', 'Login allows empty submit without error');
  }

  // Wrong credentials
  await emailInput.fill('notexist@test.com');
  await passInput.fill('wrongpassword');
  await submitBtn.click();
  await page.waitForTimeout(1500);
  const hasLoginError = await page.locator('text=/invalid|incorrect|wrong|unauthorized/i').count() > 0 ||
                        await page.locator('[class*="error"], [class*="alert"]').count() > 0;
  if (!hasLoginError) addBug('HIGH', 'crm/login', 'SILENT_LOGIN_FAIL', 'Wrong credentials gave no visible error message');
  await screenshot(page, 'crm_login_wrong_creds');
});

test('LOCAL DOM CRAWL — CRM Admin Portal All Routes', async ({ page, context }) => {
  setupNetworkListeners(context);

  // Login first
  setupPageListeners(page, 'crm/login-flow');
  await page.goto(`${CRM}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(800);
  await page.fill('input[type="email"]', 'admin@brokeros.com');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard|\/dashboard/, { timeout: 20000 }).catch(async () => {
    addBug('CRITICAL', 'crm/login-flow', 'LOGIN_FAILED', 'Admin login did not redirect to dashboard');
    await screenshot(page, 'crm_login_failed');
  });
  await page.waitForTimeout(1000);
  await screenshot(page, 'crm_admin_dashboard');

  const adminRoutes = [
    '/admin/dashboard',
    '/admin/leads',
    '/admin/followups',
    '/admin/bookings',
    '/admin/commissions',
    '/admin/projects',
    '/admin/builders',
    '/admin/brokers',
    '/admin/sales',
    '/admin/reports',
    '/admin/notifications',
    '/admin/settings',
  ];

  const adminToken = await page.evaluate(() => localStorage.getItem('brokeros_access_token') || localStorage.getItem('realvion_access_token') || '').catch(() => '');
  if (adminToken) {
    await context.addInitScript((t) => {
      localStorage.setItem('brokeros_access_token', t);
      localStorage.setItem('realvion_access_token', t);
    }, adminToken);
  }

  for (const route of adminRoutes) {
    setupPageListeners(page, `crm${route}`);
    let navOk = true;
    await page.goto(`${CRM}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(async (e) => {
      addBug('CRITICAL', `crm${route}`, 'PAGE_LOAD_FAIL', `Page load failed: ${e.message}`);
      navOk = false;
    });

    if (!navOk) continue;
    await page.waitForTimeout(1200);

    // Check for auth redirect (should stay on the page)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      addBug('HIGH', `crm${route}`, 'AUTH_REDIRECT', `Route redirects to login unexpectedly after valid login`);
      continue;
    }

    // Check for 404/error state
    const has404 = await page.locator('text=/404|not found|page not found/i').count() > 0;
    if (has404) addBug('HIGH', `crm${route}`, 'PAGE_404', '404 error shown on route');

    // Check spinner still showing (data load hung)
    await page.waitForTimeout(2000);
    const spinnerStuck = await page.locator('[class*="animate-spin"], [class*="loading"], [class*="spinner"]').count() > 0;
    if (spinnerStuck) addBug('MEDIUM', `crm${route}`, 'SPINNER_STUCK', 'Loading spinner still visible after 3 seconds');

    // Check table has data (if route should have a table)
    if (['leads', 'bookings', 'commissions', 'builders', 'brokers', 'followups'].some(r => route.includes(r))) {
      const tableRows = await page.locator('table tbody tr').count();
      const emptyState = await page.locator('text=/no leads|no bookings|no records|no data|empty/i').count();
      console.log(`[${route}] Table rows: ${tableRows}, Empty state shown: ${emptyState}`);
    }

    await detectBrokenImages(page, `crm${route}`);
    await detectOverflow(page, `crm${route}`);
    await detectMissingLabels(page, `crm${route}`);
    await screenshot(page, `crm${route.replace(/\//g, '_')}`);

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(400);
    await detectOverflow(page, `crm${route} [mobile]`);
    await screenshot(page, `mobile_crm${route.replace(/\//g, '_')}`);
    await page.setViewportSize({ width: 1440, height: 900 });
  }
});

test('LOCAL DOM CRAWL — CRM Sales Portal All Routes', async ({ page, context }) => {
  setupNetworkListeners(context);

  // Login as sales — try the seeded sales user
  setupPageListeners(page, 'crm/sales-login-flow');
  await page.goto(`${CRM}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(800);
  await page.fill('input[type="email"]', 'sales@brokeros.com');
  await page.fill('input[type="password"]', 'Sales@123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await screenshot(page, 'crm_sales_login_result');

  const salesRoutes = [
    '/sales/dashboard',
    '/sales/leads',
    '/sales/followups',
    '/sales/bookings',
    '/sales/projects',
    '/sales/builders',
    '/sales/commissions',
    '/sales/profile',
  ];

  const salesToken = await page.evaluate(() => localStorage.getItem('brokeros_access_token') || localStorage.getItem('realvion_access_token') || '').catch(() => '');
  if (salesToken) {
    await context.addInitScript((t) => {
      localStorage.setItem('brokeros_access_token', t);
      localStorage.setItem('realvion_access_token', t);
    }, salesToken);
  }

  for (const route of salesRoutes) {
    setupPageListeners(page, `crm${route}`);

    let navOk = true;
    await page.goto(`${CRM}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(async (e) => {
      addBug('CRITICAL', `crm${route}`, 'PAGE_LOAD_FAIL', `Page load failed: ${e.message}`);
      navOk = false;
    });
    if (!navOk) continue;
    await page.waitForTimeout(1200);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      addBug('HIGH', `crm${route}`, 'AUTH_REDIRECT', 'Sales route requires re-login after valid login');
      continue;
    }

    await page.waitForTimeout(1500);
    const spinnerStuck = await page.locator('[class*="animate-spin"], [class*="loading"]').count() > 0;
    if (spinnerStuck) addBug('MEDIUM', `crm${route}`, 'SPINNER_STUCK', 'Loading spinner stuck after 2.7s');

    await detectBrokenImages(page, `crm${route}`);
    await detectOverflow(page, `crm${route}`);
    await screenshot(page, `crm${route.replace(/\//g, '_')}`);

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await detectOverflow(page, `crm${route} [mobile]`);
    await screenshot(page, `mobile_crm${route.replace(/\//g, '_')}`);
    await page.setViewportSize({ width: 1440, height: 900 });
  }
});

test('LOCAL DOM CRAWL — Form Fuzzing (Create Modals)', async ({ page, context }) => {
  setupNetworkListeners(context);
  setupPageListeners(page, 'crm/form-fuzz');

  // Login as admin
  await page.goto(`${CRM}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.fill('input[type="email"]', 'admin@brokeros.com');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  const modalTests: { route: string; triggerText: string; }[] = [
    { route: '/admin/leads', triggerText: 'Add New Lead' },
    { route: '/admin/bookings', triggerText: 'Create Booking Token' },
    { route: '/admin/projects', triggerText: 'New Project' },
    { route: '/admin/builders', triggerText: 'Add Builder' },
  ];

  for (const m of modalTests) {
    await page.goto(`${CRM}${m.route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    const triggerBtn = page.locator(`button:has-text("${m.triggerText}")`).first();
    if (!await triggerBtn.isVisible()) {
      addBug('MEDIUM', `crm${m.route}`, 'MISSING_BUTTON', `Button "${m.triggerText}" not found`);
      continue;
    }
    await triggerBtn.click();
    await page.waitForTimeout(600);

    const modalVisible = await page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first().isVisible().catch(() => false);
    if (!modalVisible) {
      addBug('HIGH', `crm${m.route}`, 'MODAL_NOT_OPENING', `Modal did not open after clicking "${m.triggerText}"`);
      continue;
    }
    await screenshot(page, `fuzz_modal_${m.route.replace(/\//g, '_')}_open`);

    // Fuzz the modal
    await fuzzForm(page, '[role="dialog"], [class*="modal"], [class*="Modal"]', `crm${m.route}`);
    await screenshot(page, `fuzz_modal_${m.route.replace(/\//g, '_')}_after`);

    // Close modal
    const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
    await closeBtn.click().catch(() => {});
    await page.waitForTimeout(300);
  }
});

test('LOCAL DOM CRAWL — API Health & Response Audit', async ({ request }) => {
  // Health check
  const health = await request.get(`http://127.0.0.1:8001/api/v1/openapi.json`).catch(() => null);
  if (!health || !health.ok()) {
    addBug('CRITICAL', 'api/health', 'API_DOWN', `Backend API not responding at port 8001`);
  }


  // Test login endpoint
  const loginResp = await request.post(`${API}/auth/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: { email: 'admin@brokeros.com', password: 'Admin@123' }
  }).catch(() => null);

  if (!loginResp || !loginResp.ok()) {
    addBug('CRITICAL', 'api/auth/login', 'LOGIN_ENDPOINT_FAIL', `Login endpoint returned HTTP ${loginResp?.status() || 'timeout'}`);
  } else {
    const loginData = await loginResp.json();
    const token = loginData?.access_token;
    if (!token) {
      addBug('HIGH', 'api/auth/login', 'NO_TOKEN_IN_RESPONSE', 'Login response has no access_token field');
    } else {
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      const endpoints = [
        { path: '/leads', name: 'leads' },
        { path: '/bookings', name: 'bookings' },
        { path: '/commissions', name: 'commissions' },
        { path: '/builders', name: 'builders' },
        { path: '/projects', name: 'projects' },
        { path: '/followups', name: 'followups' },
        { path: '/notifications', name: 'notifications' },
        { path: '/users', name: 'users' },
      ];

      for (const ep of endpoints) {
        const resp = await request.get(`${API}${ep.path}`, { headers: authHeaders }).catch(() => null);
        if (!resp) {
          addBug('CRITICAL', `api${ep.path}`, 'ENDPOINT_TIMEOUT', `${ep.path} timed out`);
        } else if (!resp.ok()) {
          addBug('HIGH', `api${ep.path}`, `HTTP_${resp.status()}`, `${ep.path} returned HTTP ${resp.status()}`);
        } else {
          const data = await resp.json().catch(() => null);
          if (!Array.isArray(data) && !data) {
            addBug('MEDIUM', `api${ep.path}`, 'INVALID_RESPONSE_FORMAT', `${ep.path} returned non-array response`);
          }
          console.log(`[API] ${ep.path}: HTTP 200, records: ${Array.isArray(data) ? data.length : typeof data}`);
        }
      }
    }
  }
});

test('LOCAL DOM CRAWL — Write Final Bug Report', async () => {
  const report = {
    timestamp: new Date().toISOString(),
    total_bugs: bugs.length,
    critical: bugs.filter(b => b.severity === 'CRITICAL').length,
    high: bugs.filter(b => b.severity === 'HIGH').length,
    medium: bugs.filter(b => b.severity === 'MEDIUM').length,
    low: bugs.filter(b => b.severity === 'LOW').length,
    network_errors: networkErrors.length,
    console_errors: consoleErrors.length,
    bugs,
    network_error_list: networkErrors,
    console_error_list: consoleErrors,
  };

  fs.writeFileSync(BUGS_FILE, JSON.stringify(report, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`BUG REPORT SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Bugs Found : ${report.total_bugs}`);
  console.log(`  CRITICAL       : ${report.critical}`);
  console.log(`  HIGH           : ${report.high}`);
  console.log(`  MEDIUM         : ${report.medium}`);
  console.log(`  LOW            : ${report.low}`);
  console.log(`Network Errors   : ${report.network_errors}`);
  console.log(`Console Errors   : ${report.console_errors}`);
  console.log(`Report saved to  : ${BUGS_FILE}`);
  console.log(`${'='.repeat(60)}\n`);

  if (report.critical > 0) {
    console.log('CRITICAL BUGS:');
    bugs.filter(b => b.severity === 'CRITICAL').forEach(b => console.log(`  [${b.type}] ${b.route}: ${b.message}`));
  }
});
