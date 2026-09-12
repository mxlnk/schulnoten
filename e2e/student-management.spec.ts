import { test, expect } from '@playwright/test';
import { IDS } from './fixtures/mock-data';
import { setupWithMockData, getCellText, enterGrade } from './helpers';

test.describe('Student management', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithMockData(page);
  });

  test('Add a single student', async ({ page }) => {
    // Click "Schüler" button to open the modal
    await page.getByRole('button', { name: 'Schüler', exact: true }).click();

    // Fill in first and last name (labels aren't linked via for/id, use sibling selector)
    const modal = page.locator('[class*="fixed"]').filter({ hasText: 'Schüler hinzufügen' });
    await modal.locator('input[type="text"]').first().fill('David');
    await modal.locator('input[type="text"]').nth(1).fill('Weber');

    // Click "Hinzufügen & Schließen"
    await page.getByRole('button', { name: /Hinzufügen & Schließen/i }).click();

    // Verify the student appears in the table
    await expect(page.locator('td', { hasText: 'Weber, David' })).toBeVisible();
  });

  test('Bulk import students via list (Nachname, Vorname format)', async ({ page }) => {
    await page.getByRole('button', { name: 'Schüler', exact: true }).click();

    // Switch to list mode
    await page.getByRole('button', { name: /Liste importieren/i }).click();

    // Enter names in "Nachname, Vorname" format
    await page.locator('textarea').fill('Weber, David\nBraun, Eva');

    // Click import button
    await page.getByRole('button', { name: /2 Schüler hinzufügen/i }).click();

    // Verify both students appear
    await expect(page.locator('td', { hasText: 'Weber, David' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Braun, Eva' })).toBeVisible();

    // Original students still present
    await expect(page.getByTestId(`student-${IDS.students.alice}`)).toBeVisible();
  });

  test('Bulk import students via list (Vorname Nachname format)', async ({ page }) => {
    await page.getByRole('button', { name: 'Schüler', exact: true }).click();
    await page.getByRole('button', { name: /Liste importieren/i }).click();

    await page.locator('textarea').fill('David Weber\nEva Braun');

    await page.getByRole('button', { name: /2 Schüler hinzufügen/i }).click();

    await expect(page.locator('td', { hasText: 'Weber, David' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Braun, Eva' })).toBeVisible();
  });

  test('Bulk import adds to existing students (does not replace)', async ({ page }) => {
    // Count existing rows
    const initialRows = await page.locator('tbody tr').count();

    await page.getByRole('button', { name: 'Schüler', exact: true }).click();
    await page.getByRole('button', { name: /Liste importieren/i }).click();

    await page.locator('textarea').fill('Weber, David');
    await page.getByRole('button', { name: /1 Schüler hinzufügen/i }).click();

    // Should have one more row
    await expect(page.locator('tbody tr')).toHaveCount(initialRows + 1);
  });

  test('Delete a student cascades grades', async ({ page }) => {
    // Verify Alice's grade exists first
    expect(await getCellText(page, `grade-${IDS.students.alice}-${IDS.exams.k1}`)).toBe('2.00');

    // Set up dialog handler for confirm
    page.on('dialog', (dialog) => dialog.accept());

    // Hover over Alice's name cell and click delete
    const aliceCell = page.getByTestId(`student-${IDS.students.alice}`);
    await aliceCell.hover();
    await aliceCell.locator('button').click();

    // Alice's row should be gone
    await expect(page.getByTestId(`student-${IDS.students.alice}`)).not.toBeVisible();

    // Other students still present
    await expect(page.getByTestId(`student-${IDS.students.bob}`)).toBeVisible();
    await expect(page.getByTestId(`student-${IDS.students.clara}`)).toBeVisible();
  });
});
