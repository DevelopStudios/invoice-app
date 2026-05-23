import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
});

test('invoice list loads and shows invoice cards', async ({ page }) => {
  const cards = page.locator('.rounded-xl.bg-white, .rounded-xl.dark\\:bg-dark-surface').first();
  await expect(cards).toBeVisible();
});

test('each card shows a $ amount with decimal point', async ({ page }) => {
  const amount = page.locator('span').filter({ hasText: /^\$[\d,]+\.\d{2}$/ }).first();
  await expect(amount).toBeVisible();
});

test('invoice count text is grammatically correct for plural', async ({ page }) => {
  const count = await page.locator('h1 + p').textContent();
  expect(count).toMatch(/There are \d+ total invoices/);
});

test('filter by paid shows only paid invoices', async ({ page }) => {
  await page.getByRole('button', { name: /Filter/i }).click();
  // Click the label containing the 'paid' span inside the filter dropdown
  await page.locator('label span.capitalize').filter({ hasText: 'paid' }).click();
  await page.waitForTimeout(300);
  const statuses = await page.locator('.flex.items-center.gap-2.rounded-lg').allTextContents();
  expect(statuses.every(s => s.trim() === 'paid')).toBeTruthy();
});
