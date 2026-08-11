import { test, expect } from '@playwright/test';

test.describe('WhatsApp Click-to-Chat Feature Verification', () => {
  const CRM = 'http://localhost:5173';

  test('WhatsApp icon button is visible on Leads table rows and 360 Drawer', async ({ page }) => {
    // 1. Login as Admin
    await page.goto(`${CRM}/login`);
    await page.fill('input[type="email"]', 'admin@brokeros.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // 2. Navigate to Leads Management
    await page.goto(`${CRM}/admin/leads`);
    await page.waitForSelector('table');

    // 3. Verify WhatsApp icon button exists on lead table rows
    const waRowButtons = page.locator('button[title*="Chat on WhatsApp"]');
    const count = await waRowButtons.count();
    expect(count).toBeGreaterThan(0);

    // 4. Open 360 Lead View Drawer for first lead
    const eyeButton = page.locator('button[title="360° Lead View"]').first();
    await eyeButton.click();
    await page.waitForSelector('h3:has-text("Lead ID:")', { state: 'attached' }).catch(() => {});

    // 5. Verify WhatsApp button is rendered in Lead Drawer
    const drawerWaButton = page.locator('button:has-text("Chat on WhatsApp")');
    await expect(drawerWaButton).toBeVisible();

    console.log(`✅ WhatsApp Click-to-Chat verified: ${count} table row icons & Lead Drawer button present.`);
  });
});
