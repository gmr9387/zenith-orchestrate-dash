import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/landing');
  await expect(page.getByText('Zilliance')).toBeVisible();
});

test('protected route redirects to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/login/);
});