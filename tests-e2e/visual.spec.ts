import { test, expect } from '@playwright/test';

const VISUAL = process.env.VISUAL === 'true';

(VISUAL ? test : test.skip)('landing visual snapshot', async ({ page }) => {
  await page.goto('/landing');
  await expect(page).toHaveScreenshot('landing.png', { fullPage: true });
});