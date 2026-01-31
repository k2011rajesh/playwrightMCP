import { Page, Locator } from '@playwright/test';

interface SelectorStrategy {
  name: string;
  selector: string;
}

/**
 * Self-healing locator: tries multiple selector strategies with retry logic.
 * Useful when UI elements change classes, IDs, or structure.
 */
export async function findElementWithHealing(
  page: Page,
  strategies: SelectorStrategy[],
  timeout = 5000
): Promise<Locator | null> {
  const maxRetries = 3;
  const retryDelay = 500;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const strategy of strategies) {
      try {
        const locator = page.locator(strategy.selector);
        // Attempt to interact or verify visibility
        await locator.first().waitFor({ state: 'visible', timeout: 2000 });
        console.log(`✓ Found element using strategy: ${strategy.name}`);
        return locator;
      } catch (e) {
        console.log(`✗ Strategy "${strategy.name}" failed, trying next...`);
      }
    }
    if (attempt < maxRetries - 1) {
      console.log(`Retry attempt ${attempt + 1}/${maxRetries - 1}...`);
      await page.waitForTimeout(retryDelay);
    }
  }
  console.log('✗ Self-healing failed: element not found with any strategy');
  return null;
}

/**
 * Simplified self-healing: tries ID, data-testid, and role selectors.
 */
export async function findButton(
  page: Page,
  buttonLabel: string,
  timeout = 5000
): Promise<Locator | null> {
  const strategies: SelectorStrategy[] = [
    { name: 'role-button', selector: `button:has-text("${buttonLabel}")` },
    { name: 'data-testid', selector: `[data-testid*="${buttonLabel.toLowerCase()}"]` },
    { name: 'aria-label', selector: `[aria-label*="${buttonLabel}"]` },
    { name: 'text-exact', selector: `text="${buttonLabel}"` },
  ];
  return findElementWithHealing(page, strategies, timeout);
}

/**
 * Self-healing input finder: tries ID, name, placeholder, and aria-label.
 */
export async function findInput(
  page: Page,
  placeholder: string,
  timeout = 5000
): Promise<Locator | null> {
  const strategies: SelectorStrategy[] = [
    { name: 'placeholder', selector: `input[placeholder*="${placeholder}"]` },
    { name: 'aria-label', selector: `input[aria-label*="${placeholder}"]` },
    { name: 'data-testid', selector: `input[data-testid*="${placeholder.toLowerCase()}"]` },
    { name: 'name-attr', selector: `input[name*="${placeholder.toLowerCase()}"]` },
  ];
  return findElementWithHealing(page, strategies, timeout);
}
