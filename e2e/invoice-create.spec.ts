import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
});

test('clicking Save & Send with empty form does not navigate away', async ({ page }) => {
  await page.getByRole('button', { name: /New/i }).click();
  // The save button textContent includes hidden span "& Send"; filter by that
  await page.locator('button').filter({ hasText: /Save.*Send/s }).click();
  await expect(page).toHaveURL('/');
});

test('required fields show error state after failed save attempt', async ({ page }) => {
  await page.getByRole('button', { name: /New/i }).click();
  await page.locator('button').filter({ hasText: /Save.*Send/s }).click();
  await expect(page.getByText("can't be empty").first()).toBeVisible();
});

test('filling required fields and saving adds invoice to list', async ({ page }) => {
  await page.getByRole('button', { name: /New/i }).click();
  await page.locator('input[formcontrolname="clientName"]').fill('E2E Test Client');
  await page.locator('input[formcontrolname="clientEmail"]').fill('e2e@test.com');
  await page.getByRole('button', { name: /Add New Item/i }).click();
  await page.locator('input[formcontrolname="name"]').last().fill('Test Service');
  await page.locator('input[formcontrolname="quantity"]').last().fill('2');
  await page.locator('input[formcontrolname="price"]').last().fill('150');
  await page.locator('button').filter({ hasText: /Save.*Send/s }).click();
  await page.waitForURL('/');
  await expect(page.getByText('E2E Test Client')).toBeVisible();
});
