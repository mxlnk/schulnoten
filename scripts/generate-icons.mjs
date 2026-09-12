// Renders public/icon.svg to the PNG sizes referenced by the PWA manifest.
// Run with: npm run icons
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const svg = readFileSync(path.join(publicDir, 'icon.svg'), 'utf8');

// Maskable icons are shown full-bleed and cropped by the OS, so the artwork
// must sit inside the central 80% "safe zone" on a solid background.
const maskableSvg = svg
  .replace('<rect width="512" height="512" rx="112" fill="#2563eb"/>',
    '<rect width="512" height="512" fill="#2563eb"/><g transform="translate(256 256) scale(0.8) translate(-256 -256)">')
  .replace('</svg>', '</g></svg>');

const targets = [
  { file: 'pwa-192x192.png', size: 192, svg },
  { file: 'pwa-512x512.png', size: 512, svg },
  { file: 'apple-touch-icon.png', size: 180, svg: maskableSvg },
  { file: 'maskable-icon-512x512.png', size: 512, svg: maskableSvg },
];

const browser = await chromium.launch();
try {
  for (const { file, size, svg: source } of targets) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:transparent">${source.replace(
        /width="512" height="512"/,
        `width="${size}" height="${size}"`,
      )}</body></html>`,
    );
    const png = await page.screenshot({ omitBackground: true, type: 'png' });
    writeFileSync(path.join(publicDir, file), png);
    await page.close();
    console.log(`wrote public/${file} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
