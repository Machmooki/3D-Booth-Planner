import { chromium, expect as baseExpect } from '@playwright/test';
const expect = baseExpect.configure({ timeout: 15000 });
import assert from 'node:assert/strict';
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
  acceptDownloads: true,
});
const errors = [];
page.on('pageerror', (e) => {
  errors.push(e.message);
  console.error('Browser error:', e.stack);
});
const checks = [];
try {
  await page.goto('http://127.0.0.1:5173');
  await page.waitForSelector('canvas');
  await expect(page.getByText('All changes saved')).toBeVisible();
  await page.getByRole('button', { name: /^Backdrop 240/ }).click();
  await expect(page.getByLabel('Object name', { exact: true })).toHaveValue('Backdrop');
  await page.getByLabel('Width', { exact: true }).fill('300');
  await page.getByLabel('Width', { exact: true }).press('Enter');
  await page.getByLabel('Height', { exact: true }).fill('240');
  await page.getByLabel('Height', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Back wall', exact: true }).click();
  checks.push('add, resize, wall alignment');
  await page.getByLabel('Rotation', { exact: true }).fill('45');
  await page.getByLabel('Rotation', { exact: true }).press('Enter');
  await page.getByLabel('Undo', { exact: true }).click();
  await page.getByRole('button', { name: /In this booth/ }).click();
  await page.locator('.object-row-main').filter({ hasText: 'Backdrop' }).last().click();
  await expect(page.getByLabel('Rotation', { exact: true })).toHaveValue('0');
  await page.getByLabel('Redo', { exact: true }).click();
  await page.locator('.object-row-main').filter({ hasText: 'Backdrop' }).last().click();
  await expect(page.getByLabel('Rotation', { exact: true })).toHaveValue('45');
  checks.push('undo and redo');
  await page.getByLabel('Width', { exact: true }).fill('600');
  await page.getByLabel('Width', { exact: true }).press('Enter');
  await expect(page.getByText(/Object extends/)).toBeVisible();
  checks.push('boundary warning');
  await page.getByLabel('Width', { exact: true }).fill('300');
  await page.getByLabel('Width', { exact: true }).press('Enter');
  await page.getByLabel('Rotation', { exact: true }).fill('0');
  await page.getByLabel('Rotation', { exact: true }).press('Enter');
  await page.getByLabel('Object name', { exact: true }).fill('Branded backdrop');
  await page.getByLabel('Object name', { exact: true }).press('Enter');
  await page.getByLabel('Upload artwork file').setInputFiles({
    name: 'artwork.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      await page.evaluate(() => {
        const c = document.createElement('canvas');
        c.width = 320;
        c.height = 240;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#d6744c';
        ctx.fillRect(0, 0, 320, 240);
        ctx.fillStyle = '#ffffff';
        ctx.font = '36px sans-serif';
        ctx.fillText('MY BRAND', 45, 130);
        return c.toDataURL('image/png').split(',')[1];
      }),
      'base64',
    ),
  });
  await expect(page.getByAltText('Uploaded artwork')).toBeVisible();
  await page.getByRole('button', { name: 'fill', exact: true }).click();
  checks.push('artwork upload and fit modes');
  await page.getByRole('button', { name: /Duplicate ⌘D/ }).click();
  await expect(page.getByLabel('Object name', { exact: true })).toHaveValue(
    'Branded backdrop copy',
  );
  await expect(page.getByAltText('Uploaded artwork')).toBeVisible();
  checks.push('duplicate preserves artwork');
  await page.getByLabel('Object name', { exact: true }).focus();
  await page.keyboard.press('Backspace');
  await expect(page.getByLabel('Object name', { exact: true })).toBeVisible();
  await page.getByLabel('Object name', { exact: true }).press('Enter');
  checks.push('typing shortcuts are guarded');
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Booth settings', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Perspective', exact: true }).click();
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/booth-studio-top.png' });
  checks.push('orthographic top view');
  await page.getByRole('button', { name: 'Measure distance', exact: true }).click();
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.65);
  await page.mouse.click(box.x + box.width * 0.58, box.y + box.height * 0.65);
  await expect(page.locator('.dimension-label')).toBeVisible();
  checks.push('two-point measurement');
  await page.getByRole('button', { name: 'Select and move', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  await page.reload();
  await page.waitForSelector('canvas');
  await page.getByRole('button', { name: /In this booth/ }).click();
  await expect(
    page.locator('.object-row-main').filter({ hasText: 'Branded backdrop' }),
  ).toHaveCount(1);
  checks.push('IndexedDB survives reload');
  await page.getByRole('button', { name: /^Export/ }).click();
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const json = await jsonDownload;
  await json.saveAs('/tmp/booth-studio-test.json');
  assert.ok(json.suggestedFilename().endsWith('.json'));
  checks.push('JSON export');
  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG' }).click();
  const png = await pngDownload;
  await png.saveAs('/tmp/booth-studio-test.png');
  assert.ok(png.suggestedFilename().endsWith('.png'));
  checks.push('clean PNG export');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('link', { name: 'Booth Studio home' }).click();
  await page.getByLabel('New project name').fill('Workflow test booth');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make room for your idea.' })).toBeVisible();
  checks.push('new empty project');
  await page.getByRole('link', { name: 'Booth Studio home' }).click();
  await page.getByLabel('Import project file').setInputFiles('/tmp/booth-studio-test.json');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: /In this booth/ }).click();
  await expect(
    page.locator('.object-row-main').filter({ hasText: 'Branded backdrop' }),
  ).toHaveCount(1);
  checks.push('JSON import');
  await page.getByRole('link', { name: 'Booth Studio home' }).click();
  await page.getByLabel('Import project file').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":2}'),
  });
  await expect(page.getByRole('alert')).toContainText('not a valid');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  checks.push('invalid imports safely rejected');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await expect(page.locator('.mobile-message')).toBeVisible();
  const mobileCanvas = await page.locator('canvas').boundingBox();
  assert.ok(mobileCanvas.width > 300 && mobileCanvas.height > 300);
  await page.screenshot({ path: '/tmp/booth-studio-mobile.png' });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
  );
  checks.push('mobile preview without overflow');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: '/tmp/booth-studio-failure.png' });
  console.error({ checks, errors });
  throw error;
} finally {
  await browser.close();
}
