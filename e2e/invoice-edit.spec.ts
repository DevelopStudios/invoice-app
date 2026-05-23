import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
});

test('edit form pre-fills with existing client name', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit' }).click();
  const clientNameInput = page.locator('input[formcontrolname="clientName"]');
  await expect(clientNameInput).toHaveValue('Jensen Huang');
});

test('saving a changed client name reflects on the detail page', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.locator('input[formcontrolname="clientName"]').fill('Updated Client');
  // Save Changes button: textContent includes hidden "Changes" span; filter by Save text
  await page.locator('button').filter({ hasText: /Save.*Changes/s }).click();
  await expect(page.getByText('Updated Client')).toBeVisible();
});
