import { chromium } from '@playwright/test';
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: [
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:5173');
await page.waitForSelector('canvas');
await page.waitForTimeout(3500);
await page.screenshot({ path: '/tmp/booth-studio-desktop.png' });
console.log(
  JSON.stringify({
    title: await page.title(),
    canvas: await page.locator('canvas').count(),
    errors,
  }),
);
await browser.close();
