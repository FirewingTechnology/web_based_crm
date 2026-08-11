/**
 * Shared utilities and constants for Realvion QA test suite
 */
import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const WEBSITE_URL = 'https://realvion-official-site.onrender.com';
export const CRM_URL = 'https://web-based-crm-1.onrender.com';
export const API_URL = 'https://web-based-crm.onrender.com/api/v1';


export const SCREENSHOTS_DIR = path.resolve(__dirname, '../../test-results/screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let screenshotCounter = 1;

export async function screenshot(page: Page, name: string): Promise<string> {
  const paddedNum = String(screenshotCounter).padStart(2, '0');
  const filename = `${paddedNum}-${name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath });

  console.log(`  📸 Screenshot saved: ${filename}`);
  screenshotCounter++;
  return filepath;
}

export function resetScreenshotCounter(start = 1) {
  screenshotCounter = start;
}

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
}

export const TEST_USER = {
  name: 'QA Test User',
  email: `qa.test.${Date.now()}@mailinator.com`,
  mobile: '9876543210',
  password: 'Secure@123456',
  company: `QA Agency ${Date.now()}`,
  companyType: 'Real Estate Agency',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

export const TEST_USER_B = {
  name: 'QA Test User B',
  email: `qa.testb.${Date.now() + 1}@mailinator.com`,
  mobile: '9876543211',
  password: 'SecureB@123456',
  company: `QA Agency B ${Date.now() + 1}`,
  companyType: 'Broker',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
};

export const RAZORPAY_TEST_CARD = {
  number: '4111111111111111',
  expiry: '12/28',
  cvv: '123',
  name: 'QA Test User',
};

export const RAZORPAY_FAIL_CARD = {
  number: '4000000000000002',
  expiry: '12/28',
  cvv: '123',
  name: 'QA Fail Test',
};

// Log a network request+response for evidence
export interface NetworkCapture {
  url: string;
  method: string;
  status: number;
  requestBody?: string;
  responseBody?: string;
}

export async function captureApiRequest(
  page: Page,
  urlPattern: string,
  action: () => Promise<void>
): Promise<NetworkCapture | null> {
  let captured: NetworkCapture | null = null;

  const responseHandler = async (response: any) => {
    if (response.url().includes(urlPattern)) {
      const req = response.request();
      let reqBody = '';
      try {
        reqBody = req.postData() || '';
      } catch (_) {}
      let resBody = '';
      try {
        resBody = await response.text();
      } catch (_) {}
      captured = {
        url: response.url(),
        method: req.method(),
        status: response.status(),
        requestBody: reqBody,
        responseBody: resBody,
      };
    }
  };

  page.on('response', responseHandler);
  await action();
  await page.waitForTimeout(2000);
  page.off('response', responseHandler);

  return captured;
}

export function logResult(test: string, result: 'PASS' | 'FAIL' | 'BLOCKED', evidence: string, detail?: string) {
  const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⚠️ BLOCKED';
  console.log(`\n${icon} [${result}] ${test}`);
  console.log(`   Evidence: ${evidence}`);
  if (detail) console.log(`   Detail: ${detail}`);
}
