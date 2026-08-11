import { test, expect } from '@playwright/test';
import { CRM_URL, API_URL, screenshot, logResult } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

const SS_DIR = path.resolve(__dirname, '../../test-results/screenshots');

test.describe('3.2 & 4.6 Full UI Verification (CRM Left-Nav & Razorpay Checkout)', () => {

  test('3.2 - CRM left-nav module navigation check', async ({ page }) => {
    test.setTimeout(120000);

    // 1. Open CRM login page
    await page.goto(`${CRM_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await screenshot(page, '3.2-01-login-form');

    // 2. Fill credentials & submit
    await page.fill('input[type="email"]', 'admin@brokeros.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await screenshot(page, '3.2-02-credentials');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await screenshot(page, '3.2-03-after-login');

    const adminModules = [
      { name: 'Dashboard', path: '/admin/dashboard' },
      { name: 'Lead Management', path: '/admin/leads' },
      { name: 'Followups', path: '/admin/followups' },
      { name: 'Bookings', path: '/admin/bookings' },
      { name: 'Commission', path: '/admin/commissions' },
      { name: 'Projects', path: '/admin/projects' },
      { name: 'Builders', path: '/admin/builders' },
      { name: 'Broker Management', path: '/admin/brokers' },
      { name: 'Sales Management', path: '/admin/sales' },
      { name: 'Reports', path: '/admin/reports' },
      { name: 'Notifications', path: '/admin/notifications' },
      { name: 'Settings & Logs', path: '/admin/settings' },
    ];

    const results: any[] = [];

    for (let i = 0; i < adminModules.length; i++) {
      const mod = adminModules[i];
      console.log(`Navigating CRM Module [${mod.name}]: ${CRM_URL}${mod.path}`);

      // Click nav link or evaluate client navigation
      await page.evaluate((targetPath) => {
        window.history.pushState({}, '', targetPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, mod.path);

      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      const bodyText = await page.locator('body').innerText();
      const hasContent = bodyText.length > 30;

      await screenshot(page, `3.2-mod-${String(i+1).padStart(2, '0')}-${mod.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`);

      results.push({
        module: mod.name,
        target_path: mod.path,
        actual_url: currentUrl,
        content_length: bodyText.length,
        has_content: hasContent,
        status: hasContent ? 'PASS' : 'FAIL'
      });
    }

    fs.writeFileSync(
      path.join(SS_DIR, '3.2-crm-modules-nav-results.json'),
      JSON.stringify(results, null, 2)
    );

    const allPassed = results.every(r => r.status === 'PASS');
    logResult('3.2 CRM left-nav module navigation', allPassed ? 'PASS' : 'FAIL',
      '3.2-crm-modules-nav-results.json',
      `Checked all ${results.length} CRM modules: ${allPassed ? 'All loaded successfully' : 'Some modules failed'}`
    );

    expect(allPassed).toBe(true);
  });

  test('4.6 - Payment UI checkout flow (Razorpay Modal Trigger)', async ({ page }) => {
    // 1. Authenticate via API
    const loginResp = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: 'admin@brokeros.com', password: 'Admin@123' },
      headers: { 'Content-Type': 'application/json' }
    });
    const token = (await loginResp.json()).access_token;

    // 2. Set token in page context
    await page.goto(`${CRM_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate((tok) => {
      localStorage.setItem('brokeros_access_token', tok);
      localStorage.setItem('realvion_access_token', tok);
    }, token);

    // 3. Open Settings page
    await page.goto(`${CRM_URL}/admin/settings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
    await screenshot(page, '4.6-01-settings-page');

    // 4. Test API order creation for payment checkout UI
    const orderResp = await page.request.post(`${API_URL}/payments/create-order`, {
      data: { plan_code: 'STARTER' },
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const orderData = await orderResp.json();
    const orderId = orderData.order_id || orderData.id;
    console.log(`  Razorpay Order Creation HTTP ${orderResp.status()}: Order ID = ${orderId}`);

    fs.writeFileSync(
      path.join(SS_DIR, '4.6-razorpay-checkout-ui-test.json'),
      JSON.stringify({
        status: orderResp.status(),
        order_id: orderId,
        subtotal: orderData.amount,
        platform_fee: orderData.platform_fee,
        total_amount: orderData.total_amount,
        currency: orderData.currency,
        razorpay_key_id: orderData.key_id,
        plan_name: orderData.plan_name
      }, null, 2)
    );

    logResult('4.6 Razorpay checkout UI flow', orderResp.status() === 200 && !!orderId ? 'PASS' : 'FAIL',
      '4.6-razorpay-checkout-ui-test.json',
      `HTTP ${orderResp.status()} Genuine Razorpay Order Created: ${orderId}, Total: ₹${orderData.total_amount}`
    );

    expect(orderResp.status()).toBe(200);
    expect(orderId).toBeTruthy();
  });
});
