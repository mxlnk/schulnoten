import { test, expect, type Page } from '@playwright/test';
import { setupWithMockData, setupEmpty } from './helpers';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMPORT_DATA = {
  format: 'schulnoten',
  version: 1,
  classes: [
    {
      id: 'class-imported',
      name: '11b',
      students: [{ id: 'student-new', firstName: 'Neu', lastName: 'Student' }],
      subjects: [],
    },
  ],
};

/** Writes a temp file under test-results and returns its path. */
function writeTempFile(name: string, content: string) {
  const dir = path.join(__dirname, '..', 'test-results');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return file;
}

/**
 * Playwright cannot drive the native File System Access pickers, so these
 * tests hide the API to exercise the download / <input type="file"> fallback.
 */
async function forceFallback(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined, configurable: true });
    Object.defineProperty(window, 'showSaveFilePicker', { value: undefined, configurable: true });
  });
}

async function openFileMenu(page: Page) {
  await page.getByRole('button', { name: 'Datei' }).click();
}

test.describe('.noten files', () => {
  test('Speichern downloads a .noten file with all data', async ({ page }) => {
    await forceFallback(page);
    await setupWithMockData(page);

    // Unsaved data (never written to a file) is flagged
    await expect(page.getByTestId('file-status')).toContainText('Nicht gespeichert');
    await expect(page.getByTestId('file-dirty')).toBeVisible();

    await openFileMenu(page);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: /^Speichern(?! unter)/ }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Schulnoten.noten');

    const content = JSON.parse(fs.readFileSync((await download.path())!, 'utf-8'));
    expect(content.format).toBe('schulnoten');
    expect(content.version).toBe(1);
    expect(content.classes).toHaveLength(1);
    expect(content.classes[0].name).toBe('10a');
    expect(content.classes[0].students).toHaveLength(3);

    // After saving, the file name is shown and nothing is dirty
    await expect(page.getByTestId('file-status')).toContainText('Schulnoten.noten');
    await expect(page.getByTestId('file-dirty')).toHaveCount(0);
  });

  test('Ctrl/Cmd+S saves', async ({ page }) => {
    await forceFallback(page);
    await setupWithMockData(page);

    const downloadPromise = page.waitForEvent('download');
    await page.keyboard.press('ControlOrMeta+s');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Schulnoten.noten');
  });

  test('Öffnen replaces all data and tracks changes', async ({ page }) => {
    await forceFallback(page);
    await setupWithMockData(page);
    const tmpFile = writeTempFile('open-test.noten', JSON.stringify(IMPORT_DATA));

    // Existing unsaved data → confirm dialog
    page.on('dialog', (dialog) => dialog.accept());

    await openFileMenu(page);
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('menuitem', { name: 'Öffnen…' }).click();
    await (await chooserPromise).setFiles(tmpFile);

    await expect(page.getByText('11b', { exact: true })).toBeVisible();
    await expect(page.getByText('10a', { exact: true })).not.toBeVisible();
    await expect(page.getByTestId('file-status')).toContainText('open-test.noten');
    await expect(page.getByTestId('file-dirty')).toHaveCount(0);

    // Editing marks the file dirty …
    await page.getByRole('button', { name: 'Neue Klasse' }).click();
    await page.getByPlaceholder('Klassenname...').fill('12c');
    await page.getByPlaceholder('Klassenname...').press('Enter');
    await expect(page.getByTestId('file-dirty')).toBeVisible();

    // … and saving under the same name clears it again
    await openFileMenu(page);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: /^Speichern(?! unter)/ }).click();
    expect((await downloadPromise).suggestedFilename()).toBe('open-test.noten');
    await expect(page.getByTestId('file-dirty')).toHaveCount(0);

    fs.unlinkSync(tmpFile);
  });

  test('Legacy JSON backups can still be opened', async ({ page }) => {
    await forceFallback(page);
    await setupEmpty(page);
    const legacy = { classes: IMPORT_DATA.classes };
    const tmpFile = writeTempFile('legacy-backup.json', JSON.stringify(legacy));

    await openFileMenu(page);
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('menuitem', { name: 'Öffnen…' }).click();
    await (await chooserPromise).setFiles(tmpFile);

    await expect(page.getByText('11b', { exact: true })).toBeVisible();
    // A .json backup is imported but not adopted as the working file
    await expect(page.getByTestId('file-status')).toContainText('Nicht gespeichert');

    fs.unlinkSync(tmpFile);
  });

  test('Files opened via the OS file handler are loaded on launch', async ({ page }) => {
    // Simulate the Launch Handler API delivering a .noten file handle
    await page.addInitScript((content) => {
      const file = new File([content], 'Klasse-11b.noten', { type: 'application/x-noten' });
      const handle = {
        kind: 'file',
        name: file.name,
        getFile: async () => file,
        isSameEntry: async () => false,
      };
      Object.defineProperty(window, 'launchQueue', {
        value: {
          setConsumer(consumer: (params: { files: unknown[] }) => void) {
            setTimeout(() => consumer({ files: [handle] }), 0);
          },
        },
        configurable: true,
      });
    }, JSON.stringify(IMPORT_DATA));
    await setupEmpty(page);

    await expect(page.getByText('11b', { exact: true })).toBeVisible();
    await expect(page.getByTestId('file-status')).toContainText('Klasse-11b.noten');
    await expect(page.getByTestId('file-dirty')).toHaveCount(0);
  });

  test('File System Access API: writes to the chosen file and remembers it across reloads', async ({ page }) => {
    // Stub the native pickers with handles from the origin-private file system.
    // Those are real FileSystemFileHandles, so writing, permission checks and
    // persisting the handle in IndexedDB run exactly as with a file on disk.
    await page.addInitScript(() => {
      const opfsHandle = async (name: string) => {
        const root = await navigator.storage.getDirectory();
        return root.getFileHandle(name, { create: true });
      };
      Object.defineProperty(window, 'showSaveFilePicker', {
        value: (options: { suggestedName: string }) => opfsHandle(options.suggestedName),
        configurable: true,
      });
      Object.defineProperty(window, 'showOpenFilePicker', {
        value: async () => [await opfsHandle('Schulnoten.noten')],
        configurable: true,
      });
    });
    await setupWithMockData(page);

    await openFileMenu(page);
    await page.getByRole('menuitem', { name: 'Speichern unter…' }).click();
    await expect(page.getByTestId('file-status')).toContainText('Schulnoten.noten');
    await expect(page.getByTestId('file-dirty')).toHaveCount(0);

    const readSaved = () =>
      page.evaluate(async () => {
        const root = await navigator.storage.getDirectory();
        const handle = await root.getFileHandle('Schulnoten.noten');
        return JSON.parse(await (await handle.getFile()).text());
      });
    expect((await readSaved()).classes[0].name).toBe('10a');

    // After a reload the handle comes back from IndexedDB …
    await page.reload();
    await page.locator('table').waitFor({ state: 'visible' });
    await expect(page.getByTestId('file-status')).toContainText('Schulnoten.noten');
    await expect(page.getByTestId('file-dirty')).toHaveCount(0);

    await page.getByRole('button', { name: 'Neue Klasse' }).click();
    await page.getByPlaceholder('Klassenname...').fill('12c');
    await page.getByPlaceholder('Klassenname...').press('Enter');
    await expect(page.getByTestId('file-dirty')).toBeVisible();

    // … so saving writes to the same file without asking for a location again
    await page.evaluate(() => {
      Object.defineProperty(window, 'showSaveFilePicker', {
        value: () => Promise.reject(new Error('picker must not open for a known file')),
        configurable: true,
      });
    });
    await page.keyboard.press('ControlOrMeta+s');
    await expect(page.getByTestId('file-dirty')).toHaveCount(0);
    expect((await readSaved()).classes.map((c: { name: string }) => c.name)).toEqual(['10a', '12c']);

    // Öffnen with the same file reloads it without a confirm (nothing unsaved)
    await openFileMenu(page);
    await page.getByRole('menuitem', { name: 'Öffnen…' }).click();
    await expect(page.getByText('12c', { exact: true })).toBeVisible();
  });

  test('Neue Datei clears data after confirmation', async ({ page }) => {
    await setupWithMockData(page);
    page.on('dialog', (dialog) => dialog.accept());

    await openFileMenu(page);
    await page.getByRole('menuitem', { name: 'Neue Datei' }).click();

    await expect(page.getByText('10a', { exact: true })).not.toBeVisible();
    await expect(page.getByTestId('file-status')).toContainText('Keine Datei');
  });

  test('CSV export produces a file with correct filename', async ({ page }) => {
    await setupWithMockData(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV Export' }).click();

    const download = await downloadPromise;
    // Filename should be "{className}-{subjectName}.csv"
    expect(download.suggestedFilename()).toBe('10a-Mathematik.csv');
  });
});
