import { test, expect } from '@playwright/test';
import { IDS, EXPECTED } from './fixtures/mock-data';
import { setupWithMockData, getCellText, enterGrade } from './helpers';

test.describe('Grade calculations', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithMockData(page);
  });

  // --- Category averages ---

  test('Alice category averages are correct', async ({ page }) => {
    expect(await getCellText(page, `avg-${IDS.students.alice}-${IDS.categories.klausuren}`)).toBe(EXPECTED.alice.klausurenAvg);
    expect(await getCellText(page, `avg-${IDS.students.alice}-${IDS.categories.muendlich}`)).toBe(EXPECTED.alice.muendlichAvg);
  });

  test('Bob category averages are correct', async ({ page }) => {
    expect(await getCellText(page, `avg-${IDS.students.bob}-${IDS.categories.klausuren}`)).toBe(EXPECTED.bob.klausurenAvg);
    expect(await getCellText(page, `avg-${IDS.students.bob}-${IDS.categories.muendlich}`)).toBe(EXPECTED.bob.muendlichAvg);
  });

  test('Clara shows dashes for all averages', async ({ page }) => {
    expect(await getCellText(page, `avg-${IDS.students.clara}-${IDS.categories.klausuren}`)).toBe(EXPECTED.clara.klausurenAvg);
    expect(await getCellText(page, `avg-${IDS.students.clara}-${IDS.categories.muendlich}`)).toBe(EXPECTED.clara.muendlichAvg);
  });

  // --- Final grades ---

  test('Final grades are correct for all students', async ({ page }) => {
    expect(await getCellText(page, `final-${IDS.students.alice}`)).toBe(EXPECTED.alice.final);
    expect(await getCellText(page, `final-${IDS.students.bob}`)).toBe(EXPECTED.bob.final);
    expect(await getCellText(page, `final-${IDS.students.clara}`)).toBe(EXPECTED.clara.final);
  });

  // --- Recalculation after grade entry ---

  test('Recalculates after entering a grade for Clara', async ({ page }) => {
    // Clara had no grades — enter K1 = 1
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.k1}`, '1');

    // Klausuren Ø should now be 1.00
    expect(await getCellText(page, `avg-${IDS.students.clara}-${IDS.categories.klausuren}`)).toBe('1.00');
    // Mündlich still empty
    expect(await getCellText(page, `avg-${IDS.students.clara}-${IDS.categories.muendlich}`)).toBe('-');
    // Final = only Klausuren contributes → 1.00 → "1"
    expect(await getCellText(page, `final-${IDS.students.clara}`)).toBe('1');
  });

  // --- Recalculation after grade change ---

  test('Recalculates after changing a grade', async ({ page }) => {
    // Change Alice K1 from 2 to 4
    await enterGrade(page, `grade-${IDS.students.alice}-${IDS.exams.k1}`, '4');

    // New Klausuren Ø = (4×2 + 3×1) / 3 = 11/3 ≈ 3.67
    expect(await getCellText(page, `avg-${IDS.students.alice}-${IDS.categories.klausuren}`)).toBe('3.67');
    // Mündlich unchanged
    expect(await getCellText(page, `avg-${IDS.students.alice}-${IDS.categories.muendlich}`)).toBe('1.50');
    // Final = (3.667×2 + 1.5×1) / 3 ≈ 2.94 → "3"
    expect(await getCellText(page, `final-${IDS.students.alice}`)).toBe('3');
  });

  // --- Recalculation after grade deletion ---

  test('Recalculates after deleting a grade', async ({ page }) => {
    // Delete Alice K2 by clearing it
    await enterGrade(page, `grade-${IDS.students.alice}-${IDS.exams.k2}`, '');

    // Klausuren Ø = only K1 remains: 2×2 / 2 = 2.00
    expect(await getCellText(page, `avg-${IDS.students.alice}-${IDS.categories.klausuren}`)).toBe('2.00');
    // Mündlich unchanged
    expect(await getCellText(page, `avg-${IDS.students.alice}-${IDS.categories.muendlich}`)).toBe('1.50');
    // Final = (2.0×2 + 1.5×1) / 3 ≈ 1.833 → base=1, decimal=0.833 → "2+"
    expect(await getCellText(page, `final-${IDS.students.alice}`)).toBe('2+');
  });

  // --- formatFinalGrade boundary values ---

  test('formatFinalGrade shows correct Tendenz notation', async ({ page }) => {
    // Set up Clara with specific grades to test boundary values
    // Target: final grade ≈ 2.25 → should show "2-" (decimal 0.25 is between 0.125 and 0.375)
    // With only Klausuren: K1=2, K2=3 → Ø = (2×2+3×1)/3 = 2.333
    // With only Mündlich: M1=2 → Ø = 2.0
    // Final = (2.333×2 + 2.0×1) / 3 = 6.667/3 = 2.222 → decimal 0.222 → "2-"
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.k1}`, '2');
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.k2}`, '3');
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.m1}`, '2');

    expect(await getCellText(page, `final-${IDS.students.clara}`)).toBe('2-');
  });

  test('formatFinalGrade shows X-Y notation for mid-range values', async ({ page }) => {
    // Target: decimal between 0.375 and 0.625 → "X-Y"
    // Clara: K1=2, K2=3 → Klausuren Ø = 2.333
    // M1=3, M2=3 → Mündlich Ø = 3.0
    // Final = (2.333×2 + 3.0×1) / 3 = 7.667/3 = 2.556 → "2-3"
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.k1}`, '2');
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.k2}`, '3');
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.m1}`, '3');
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.m2}`, '3');

    expect(await getCellText(page, `final-${IDS.students.clara}`)).toBe('2-3');
  });

  test('formatFinalGrade shows X+ notation', async ({ page }) => {
    // Target: decimal between 0.625 and 0.875 → "X+1+"
    // Clara: K1=3, K2=3 → Klausuren Ø = 3.0
    // M1=2, M2=2 → Mündlich Ø = 2.0
    // Final = (3.0×2 + 2.0×1) / 3 = 8/3 = 2.667 → "3+"
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.k1}`, '3');
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.k2}`, '3');
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.m1}`, '2');
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.m2}`, '2');

    expect(await getCellText(page, `final-${IDS.students.clara}`)).toBe('3+');
  });

  // --- Comma notation ---

  test('Accepts comma notation (2,5 → 2.50)', async ({ page }) => {
    await enterGrade(page, `grade-${IDS.students.clara}-${IDS.exams.k1}`, '2,5');

    expect(await getCellText(page, `grade-${IDS.students.clara}-${IDS.exams.k1}`)).toBe('2.50');
  });
});
