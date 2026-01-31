import { test, expect } from '@playwright/test';
import { findButton, findInput, findElementWithHealing } from './helpers/self-healing';

// Self-healing test on Playwright demo site (accessible sample UI)
test.describe('Self-Healing Locator Tests', () => {
  test('PROJ-102 demo site: navigate and find elements with healing', async ({ page }) => {
    // Visit Playwright demo site
    await page.goto('https://demo.playwright.dev/todomvc');

    // Self-healing find input with multiple strategies
    const todoInput = await findInput(page, 'What needs to be done');
    expect(todoInput).not.toBeNull();

    // Type into the healed input
    await todoInput?.fill('Test self-healing feature');
    await page.keyboard.press('Enter');

    // Wait for the todo to appear
    await page.waitForTimeout(500);

    // Self-healing find button (may be called "Clear" or styled differently)
    const items = page.locator('.todo-list li');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✓ Self-healing test passed: found and interacted with ${count} todo item(s)`);
  });

  test('PROJ-103 resilient form interaction', async ({ page }) => {
    // Visit another sample site with dynamic elements
    await page.goto('https://the-internet.herokuapp.com/');

    // Self-healing find a link
    const formLink = await findElementWithHealing(
      page,
      [
        { name: 'link-text', selector: `a:has-text("Form Authentication")` },
        { name: 'href-contains', selector: `a[href*="login"]` },
      ],
      3000
    );

    expect(formLink).not.toBeNull();
    console.log('✓ Self-healing found form authentication link');
  });
});
