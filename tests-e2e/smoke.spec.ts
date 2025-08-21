import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/landing');
  await expect(page.getByText('Zilliance')).toBeVisible();
});

test('protected route redirects to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/login/);
});

test('tutorial builder loads with tabs', async ({ page }) => {
  // This would need auth bypass or demo mode
  await page.goto('/tutorial-builder');
  await expect(page.getByText('Enterprise Tutorial Builder')).toBeVisible();
  await expect(page.getByText('Tutorials')).toBeVisible();
  await expect(page.getByText('Workflows')).toBeVisible();
});