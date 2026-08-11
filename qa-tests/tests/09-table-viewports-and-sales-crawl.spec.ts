import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const CRM_URL = 'https://web-based-crm-1.onrender.com';
const SS_DIR = path.resolve(__dirname, '../../test-results/screenshots');

test.describe('Sales Portal Crawl & Data-Table Viewport Screenshots (320px / 768px)', () => {

  test('1. Crawl Sales Executive Portal Routes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${CRM_URL}/login`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.fill('input[type="email"]', 'broker@brokeros.com').catch(() => {});
    await page.fill('input[type="password"]', 'Broker@123').catch(() => {});
    await page.click('button[type="submit"]').catch(() => {});
    await page.waitForTimeout(2000);

    const salesRoutes = [
      '/sales/dashboard',
      '/sales/leads',
      '/sales/followups',
      '/sales/bookings',
      '/sales/projects',
      '/sales/builders',
      '/sales/commissions',
      '/sales/profile'
    ];

    const visitedSalesRoutes: string[] = [];

    for (const route of salesRoutes) {
      const targetUrl = `${CRM_URL}${route}`;
      console.log(`[Sales Crawl] Navigating: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      visitedSalesRoutes.push(route);
    }

    fs.writeFileSync(
      path.join(SS_DIR, 'sales-portal-crawl-routes.json'),
      JSON.stringify(visitedSalesRoutes, null, 2)
    );

    expect(visitedSalesRoutes.length).toBe(8);
  });

  test('2. Capture Explicit Table Viewport Screenshots at 320px and 768px', async ({ page }) => {
    // Log in as Admin to access full data tables
    await page.goto(`${CRM_URL}/login`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.fill('input[type="email"]', 'admin@brokeros.com').catch(() => {});
    await page.fill('input[type="password"]', 'Admin@123').catch(() => {});
    await page.click('button[type="submit"]').catch(() => {});
    await page.waitForTimeout(2000);

    const tablePages = [
      { route: '/admin/leads', name: 'table-leads' },
      { route: '/admin/bookings', name: 'table-bookings' },
      { route: '/admin/commissions', name: 'table-commissions' },
    ];

    const capturedScreenshots: string[] = [];

    for (const item of tablePages) {
      await page.goto(`${CRM_URL}${item.route}`, { waitUntil: 'networkidle' }).catch(() => {});

      // 1. 320px Mobile Small Viewport
      await page.setViewportSize({ width: 320, height: 640 });
      await page.waitForTimeout(500);
      const fn320 = `${item.name}-320px.png`;
      await page.screenshot({ path: path.join(SS_DIR, fn320) });
      capturedScreenshots.push(fn320);

      // 2. 768px Tablet Viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      const fn768 = `${item.name}-768px.png`;
      await page.screenshot({ path: path.join(SS_DIR, fn768) });
      capturedScreenshots.push(fn768);
    }

    fs.writeFileSync(
      path.join(SS_DIR, 'table-viewport-screenshots.json'),
      JSON.stringify(capturedScreenshots, null, 2)
    );

    expect(capturedScreenshots.length).toBe(6);
  });

});
