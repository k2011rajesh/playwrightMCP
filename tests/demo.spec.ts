import { test, expect } from '@playwright/test';

// Include Jira test key in the test title for automatic mapping (example: PROJ-101)
test('PROJ-101 homepage has Playwright in title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});