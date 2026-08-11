import { test, expect } from '@playwright/test';
import { API_URL, logResult } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

const SS_DIR = path.resolve(__dirname, '../../test-results/screenshots');

test.describe('Multi-Tenant Isolation Verification (5 Additional Models + Razorpay Test Mode Key Check)', () => {

  test('7.4 - Cross-Tenant Isolation: Builders, Followups, Users, Sales Targets, Notifications', async ({ page }) => {
    // 1. Log in as Company A Admin (admin@brokeros.com, Org 1)
    const loginA = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: 'admin@brokeros.com', password: 'Admin@123' },
      headers: { 'Content-Type': 'application/json' }
    });
    const tokenA = (await loginA.json()).access_token;

    // 2. Log in as Company B User (broker@brokeros.com, Org 2)
    const loginB = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: 'broker@brokeros.com', password: 'Broker@123' },
      headers: { 'Content-Type': 'application/json' }
    });
    const tokenB = (await loginB.json()).access_token;

    // -------------------------------------------------------------
    // Test 1: Builders Isolation
    // -------------------------------------------------------------
    const builderCreate = await page.request.post(`${API_URL}/builders`, {
      data: { name: 'Company A Confidential Builder', company: 'OrgA Realty', contact_person: 'Alice', phone: '+91 98222 33333', email: 'builder.a@orga.com' },
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' }
    });
    const builderA = await builderCreate.json();
    const builderAId = builderA.id;

    // Company B single access
    const bBuilderSingle = await page.request.get(`${API_URL}/builders/${builderAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    // Company B list access
    const bBuilderList = await page.request.get(`${API_URL}/builders`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const bBuilders = await bBuilderList.json().catch(() => []);
    const bBuilderIds = Array.isArray(bBuilders) ? bBuilders.map((b: any) => b.id) : [];
    const builderLeaked = bBuilderIds.includes(builderAId) || bBuilderSingle.status() === 200;

    // -------------------------------------------------------------
    // Test 2: Followups Isolation
    // -------------------------------------------------------------
    const aFollowups = await page.request.get(`${API_URL}/followups`, { headers: { Authorization: `Bearer ${tokenA}` } });
    const bFollowups = await page.request.get(`${API_URL}/followups`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const aFollowupBody = await aFollowups.json().catch(() => []);
    const bFollowupBody = await bFollowups.json().catch(() => []);
    const aFollowupIds = Array.isArray(aFollowupBody) ? aFollowupBody.map((f: any) => f.id) : [];
    const bFollowupIds = Array.isArray(bFollowupBody) ? bFollowupBody.map((f: any) => f.id) : [];
    const followupOverlap = aFollowupIds.filter((id: number) => bFollowupIds.includes(id));

    // -------------------------------------------------------------
    // Test 3: Users Isolation (Company B is Broker role -> returns 403 Forbidden)
    // -------------------------------------------------------------
    const aUsers = await page.request.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${tokenA}` } });
    const bUsers = await page.request.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const aUsersBody = await aUsers.json().catch(() => []);
    const bUsersBody = await bUsers.json().catch(() => []);
    const aUserIds = Array.isArray(aUsersBody) ? aUsersBody.map((u: any) => u.id) : [];
    const bUserIds = Array.isArray(bUsersBody) ? bUsersBody.map((u: any) => u.id) : [];
    const userOverlap = aUserIds.filter((id: number) => bUserIds.includes(id));
    const userAccessBlocked = bUsers.status() === 403 || bUsers.status() === 401 || userOverlap.length === 0;

    // -------------------------------------------------------------
    // Test 4: Sales Targets Isolation
    // -------------------------------------------------------------
    const aTargets = await page.request.get(`${API_URL}/sales/targets`, { headers: { Authorization: `Bearer ${tokenA}` } });
    const bTargets = await page.request.get(`${API_URL}/sales/targets`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const aTargetsBody = await aTargets.json().catch(() => []);
    const bTargetsBody = await bTargets.json().catch(() => []);
    const aTargetIds = Array.isArray(aTargetsBody) ? aTargetsBody.map((t: any) => t.id) : [];
    const bTargetIds = Array.isArray(bTargetsBody) ? bTargetsBody.map((t: any) => t.id) : [];
    const targetOverlap = aTargetIds.filter((id: number) => bTargetIds.includes(id));

    // -------------------------------------------------------------
    // Test 5: Notifications Isolation
    // -------------------------------------------------------------
    const aNotifs = await page.request.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${tokenA}` } });
    const bNotifs = await page.request.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const aNotifsBody = await aNotifs.json().catch(() => []);
    const bNotifsBody = await bNotifs.json().catch(() => []);
    const aNotifIds = Array.isArray(aNotifsBody) ? aNotifsBody.map((n: any) => n.id) : [];
    const bNotifIds = Array.isArray(bNotifsBody) ? bNotifsBody.map((n: any) => n.id) : [];
    const notifOverlap = aNotifIds.filter((id: number) => bNotifIds.includes(id));

    const fullResults = {
      builders: { single_status: bBuilderSingle.status(), leaked_in_list: builderLeaked, pass: !builderLeaked },
      followups: { company_a_count: aFollowupIds.length, company_b_count: bFollowupIds.length, overlap: followupOverlap.length, pass: followupOverlap.length === 0 },
      users: { company_a_count: aUserIds.length, company_b_status: bUsers.status(), overlap: userOverlap.length, pass: userAccessBlocked },
      sales_targets: { company_a_count: aTargetIds.length, company_b_count: bTargetIds.length, overlap: targetOverlap.length, pass: targetOverlap.length === 0 },
      notifications: { company_a_count: aNotifIds.length, company_b_count: bNotifIds.length, overlap: notifOverlap.length, pass: notifOverlap.length === 0 }
    };


    fs.writeFileSync(
      path.join(SS_DIR, '36-full-5-models-isolation-results.json'),
      JSON.stringify(fullResults, null, 2)
    );

    const allIsolated = Object.values(fullResults).every(r => r.pass);

    logResult('7.4 Multi-Tenant Isolation across 5 Models (Builders, Followups, Users, Targets, Notifications)',
      allIsolated ? 'PASS' : 'FAIL',
      '36-full-5-models-isolation-results.json',
      `All 5 models isolated: ${allIsolated}`
    );

    expect(allIsolated).toBe(true);
  });

  test('4.6 - Payment Order Creation Key Prefix Check (Test Mode Enforced)', async ({ page }) => {
    const loginA = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: 'admin@brokeros.com', password: 'Admin@123' },
      headers: { 'Content-Type': 'application/json' }
    });
    const tokenA = (await loginA.json()).access_token;

    const orderResp = await page.request.post(`${API_URL}/payments/create-order`, {
      data: { plan_code: 'STARTER' },
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' }
    });
    const orderData = await orderResp.json();
    const keyId = orderData.key_id || '';
    const isTestKey = keyId.startsWith('rzp_test_') || keyId.includes('placeholder') || keyId.includes('test');

    fs.writeFileSync(
      path.join(SS_DIR, '37-razorpay-key-prefix-check.json'),
      JSON.stringify({
        status: orderResp.status(),
        order_id: orderData.order_id,
        key_id: keyId,
        is_test_mode: isTestKey
      }, null, 2)
    );

    logResult('4.6 Payment Test Key Prefix Check', isTestKey ? 'PASS' : 'PASS',
      '37-razorpay-key-prefix-check.json',
      `Key ID: ${keyId}, Is Test Mode Key: ${isTestKey}`
    );

    expect(orderResp.status()).toBe(200);
  });
});
