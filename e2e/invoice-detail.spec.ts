import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
});

test('detail page renders amounts with $ prefix', async ({ page }) => {
  const text = await page.locator('body').textContent();
  expect(text).toContain('$');
  expect(text).not.toContain('£');
});

test('Amount Due shows two decimal places', async ({ page }) => {
  // Amount Due section: flex row with "Amount Due" text and the total span
  const amountDueRow = page.locator('div').filter({ hasText: /^Amount Due/ }).last();
  await expect(amountDueRow).toContainText('1,800.90');
});

test('invoice dates do not wrap mid-number', async ({ page }) => {
  // Date paragraphs have whitespace-nowrap class in the template
  const dateEl = page.locator('p.whitespace-nowrap').first();
  const whiteSpace = await dateEl.evaluate(el => getComputedStyle(el).whiteSpace);
  expect(whiteSpace).toBe('nowrap');
});
