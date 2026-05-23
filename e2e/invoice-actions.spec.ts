import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
});

test('delete confirmation modal names the invoice ID', async ({ page }) => {
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('RT3080')).toBeVisible();
});

test('confirming delete removes invoice from list', async ({ page }) => {
  await page.goto('/invoice/XM9141');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: /Delete/i }).last().click();
  await page.waitForURL('/');
  await expect(page.getByText('#XM9141')).not.toBeVisible();
});

test('Mark as Paid changes status badge to paid', async ({ page }) => {
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Mark as Paid' }).click();
  await expect(page.locator('[class*="capitalize"]').filter({ hasText: 'paid' })).toBeVisible();
});

test('Mark as Paid button is disabled on already-paid invoice', async ({ page }) => {
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Mark as Paid' }).click();
  await expect(page.getByRole('button', { name: 'Mark as Paid' })).toBeDisabled();
});
