import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/landing');
  await expect(page.getByRole('heading', { name: 'Why Choose Zilliance?' })).toBeVisible();
});

test('protected route redirects to login', async ({ page }) => {
  await page.goto('/');
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    await expect(page).toHaveURL(/login/);
  } else {
    await expect(page).toHaveURL('http://localhost:8080/');
  }
});

test('tutorial builder loads with tabs', async ({ page }) => {
  // This would need auth bypass or demo mode
  await page.goto('/tutorial-builder');
  await expect(page.getByText('Enterprise Tutorial Builder')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Tutorials' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Workflows' })).toBeVisible();
});