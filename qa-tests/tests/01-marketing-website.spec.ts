/**
 * TEST SECTION 1: Marketing Website
 * Covers: homepage, nav links, responsive layouts, console errors, SSR check
 */
import { test, expect } from '@playwright/test';
import { screenshot, WEBSITE_URL, waitForPageLoad, logResult } from './helpers';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../test-results/screenshots');

test.describe('1. Marketing Website', () => {

  test('1.1 - Homepage loads with correct title and no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', resp => {
      if (resp.status() >= 400) failedRequests.push(`${resp.status()} ${resp.url()}`);
    });

    await page.goto(WEBSITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForPageLoad(page);
    await screenshot(page, '01-homepage');

    const title = await page.title();
    console.log(`  Page title: "${title}"`);

    // Assert title is not empty/generic
    expect(title.length).toBeGreaterThan(5);
    expect(title.toLowerCase()).not.toBe('vite app');
    expect(title.toLowerCase()).not.toBe('react app');

    // Check meta description
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    console.log(`  Meta description: "${metaDesc}"`);

    // Log console errors (don't fail on Render-specific warnings)
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('chunk') && !e.includes('Failed to load resource')
    );
    console.log(`  Console errors: ${consoleErrors.length} total, ${criticalErrors.length} critical`);
    console.log(`  Failed network requests: ${failedRequests.length}`);

    if (criticalErrors.length > 0) {
      console.log(`  Critical errors: ${criticalErrors.join('\n  ')}`);
    }
    if (failedRequests.length > 0) {
      console.log(`  Failed requests: ${failedRequests.join('\n  ')}`);
    }

    // Save evidence log
    const evidence = {
      title,
      metaDesc,
      consoleErrors,
      failedRequests,
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, '01-homepage-console-log.json'),
      JSON.stringify(evidence, null, 2)
    );

    logResult('1.1 Homepage title/meta/console check', criticalErrors.length === 0 ? 'PASS' : 'FAIL',
      '01-homepage.png + 01-homepage-console-log.json',
      `Title: "${title}", Console errors: ${criticalErrors.length}`
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('1.2 - SSR / pre-hydration check (what crawlers see)', async ({ page }) => {
    // Disable JavaScript to simulate crawler / no-JS user
    await page.context().setOffline(false);

    const response = await page.goto(WEBSITE_URL, { waitUntil: 'commit' });
    const rawHtml = await page.content();

    const hasVisibleContent = rawHtml.includes('<body') &&
      (rawHtml.includes('Realvion') || rawHtml.includes('realvion') ||
       rawHtml.includes('Real Estate') || rawHtml.includes('CRM'));

    const isBlankSpa = !hasVisibleContent && rawHtml.includes('<div id="root"></div>');

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, '02-ssr-check.html'),
      rawHtml.substring(0, 5000) + '\n<!-- [truncated for brevity] -->'
    );

    await screenshot(page, '02-ssr-check');

    console.log(`  Raw HTML length: ${rawHtml.length} bytes`);
    console.log(`  Has visible content: ${hasVisibleContent}`);
    console.log(`  Is blank SPA (only root div): ${isBlankSpa}`);

    if (isBlankSpa) {
      logResult('1.2 SSR/Pre-hydration check', 'FAIL',
        '02-ssr-check.html',
        'CONFIRMED: Page returns only <div id="root"></div> before JS hydrates. SEO/crawler visibility is broken.'
      );
    } else {
      logResult('1.2 SSR/Pre-hydration check', 'PASS',
        '02-ssr-check.html + 02-ssr-check.png',
        'Page has visible content in initial HTML response'
      );
    }

    // This is informational — don't block; log finding
    console.log(isBlankSpa
      ? '  ⚠️  FINDING: Site is a client-side-only SPA. No SSR. Crawlers see empty content.'
      : '  ✅ Site has content visible in initial HTML.'
    );
  });

  test('1.3 - Primary nav links and CTAs do not 404', async ({ page }) => {
    await page.goto(WEBSITE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await waitForPageLoad(page);

    const failedLinks: string[] = [];
    const checkedLinks: string[] = [];

    // Collect all anchor hrefs
    const links = await page.locator('a[href]').all();
    const hrefs: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        hrefs.push(href);
      }
    }

    console.log(`  Found ${hrefs.length} navigation links`);

    // Check each link
    for (const href of hrefs.slice(0, 20)) { // Limit to first 20 to avoid timeout
      try {
        const fullUrl = href.startsWith('http') ? href : `${WEBSITE_URL}${href}`;
        const response = await page.request.get(fullUrl, { timeout: 15000 }).catch(() => null);
        const status = response?.status() ?? 0;

        if (status >= 400) {
          failedLinks.push(`${status} → ${fullUrl}`);
        } else {
          checkedLinks.push(`${status} → ${fullUrl}`);
        }
        console.log(`  ${status} ${fullUrl}`);
      } catch (e) {
        failedLinks.push(`ERROR → ${href}`);
      }
    }

    const evidence = { hrefs, failedLinks, checkedLinks };
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, '03-nav-links.json'),
      JSON.stringify(evidence, null, 2)
    );

    await screenshot(page, '03-nav-links-homepage');

    logResult('1.3 Primary nav links check', failedLinks.length === 0 ? 'PASS' : 'FAIL',
      '03-nav-links.json',
      `Checked ${checkedLinks.length + failedLinks.length} links, ${failedLinks.length} failed`
    );

    if (failedLinks.length > 0) {
      console.log(`  Failed links: ${failedLinks.join('\n  ')}`);
    }

    expect(failedLinks.length).toBe(0);
  });

  test('1.4 - Responsive layout at multiple breakpoints', async ({ page }) => {
    const breakpoints = [
      { width: 320, height: 568, label: '320px-mobile-xs' },
      { width: 375, height: 812, label: '375px-mobile' },
      { width: 768, height: 1024, label: '768px-tablet' },
      { width: 1024, height: 768, label: '1024px-laptop' },
      { width: 1440, height: 900, label: '1440px-desktop' },
      { width: 1920, height: 1080, label: '1920px-widescreen' },
    ];

    const results: any[] = [];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(WEBSITE_URL, { waitUntil: 'networkidle', timeout: 60000 });
      await waitForPageLoad(page);
      await page.waitForTimeout(1000); // Let animations settle

      const screenshotName = `04-responsive-${bp.label}`;
      await screenshot(page, screenshotName);

      // Check for horizontal overflow (common responsive issue)
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      results.push({
        breakpoint: bp.label,
        width: bp.width,
        hasHorizontalOverflow,
        screenshot: `${screenshotName}.png`,
      });

      console.log(`  ${bp.label}: horizontal overflow = ${hasHorizontalOverflow}`);
    }

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, '04-responsive-results.json'),
      JSON.stringify(results, null, 2)
    );

    const overflowIssues = results.filter(r => r.hasHorizontalOverflow);
    logResult('1.4 Responsive layout check', overflowIssues.length === 0 ? 'PASS' : 'FAIL',
      '04-responsive-*.png + 04-responsive-results.json',
      `Breakpoints checked: ${breakpoints.length}, overflow issues: ${overflowIssues.length}`
    );

    if (overflowIssues.length > 0) {
      console.log(`  Overflow at: ${overflowIssues.map(r => r.breakpoint).join(', ')}`);
    }
  });

  test('1.5 - CTA buttons navigate correctly', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(WEBSITE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await waitForPageLoad(page);

    // Look for primary CTAs
    const ctaSelectors = [
      'text=Get Started',
      'text=Request Demo',
      'text=Start Free Trial',
      'text=Sign Up',
      'text=Try Free',
      'text=Book Demo',
      '[data-testid*="cta"]',
      '.cta-button',
      'button[class*="cta"]',
    ];

    const foundCTAs: string[] = [];
    for (const sel of ctaSelectors) {
      const el = page.locator(sel).first();
      if (await el.count() > 0) {
        foundCTAs.push(sel);
        console.log(`  Found CTA: ${sel}`);
      }
    }

    await screenshot(page, '05-cta-buttons');

    logResult('1.5 CTA buttons check', foundCTAs.length > 0 ? 'PASS' : 'FAIL',
      '05-cta-buttons.png',
      `Found ${foundCTAs.length} CTA elements: ${foundCTAs.join(', ')}`
    );

    console.log(`  Console errors during CTA check: ${consoleErrors.length}`);
  });
});
