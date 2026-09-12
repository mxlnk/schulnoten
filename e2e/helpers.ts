import type { Page } from '@playwright/test';
import { MOCK_STORAGE } from './fixtures/mock-data';

/** Navigate to the app, inject mock data into localStorage, and reload. */
export async function setupWithMockData(page: Page) {
  await page.goto('/');
  await page.evaluate((data) => {
    localStorage.setItem('schulnoten-storage', JSON.stringify(data));
  }, MOCK_STORAGE);
  await page.reload();
  // Wait for the grade sheet table to be visible
  await page.locator('table').waitFor({ state: 'visible' });
}

/** Navigate to the app with empty localStorage. */
export async function setupEmpty(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/** Shorthand for page.getByTestId(). */
export function getTestId(page: Page, testId: string) {
  return page.getByTestId(testId);
}

/**
 * Enter a grade into a cell identified by data-testid.
 * Double-clicks the cell to activate edit mode, fills the value, and presses Enter.
 */
export async function enterGrade(page: Page, testId: string, value: string) {
  const cell = page.getByTestId(testId);
  await cell.dblclick();
  const input = cell.locator('input');
  await input.fill(value);
  await input.press('Enter');
}

/** Read the visible text content from a cell identified by data-testid. */
export async function getCellText(page: Page, testId: string) {
  return page.getByTestId(testId).innerText();
}
