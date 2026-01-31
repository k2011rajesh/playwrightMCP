import { test, expect } from '@playwright/test';

// Single-URL test: set TARGET_URL env var or it defaults to example.com
const TARGET_URL = process.env.TARGET_URL || 'https://example.com';

test.describe('Single URL run', () => {
  test('visit target URL and check title or content', async ({ page }) => {
    await page.goto(TARGET_URL);
    // Simple assertion: page has a title or contains 'Example'
    const title = await page.title();
    if (title) {
      expect(title.length).toBeGreaterThan(0);
    } else {
      await expect(page.locator('body')).toContainText('Example');
    }
  });
});
