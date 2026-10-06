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
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByText('All changes saved')).toBeVisible();
  await page.getByRole('link', { name: 'Booth Studio home' }).click();
  await page.getByLabel('New project name').fill('Drag verification');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByRole('button', { name: /^Counter 110/ }).click();
  await page.getByRole('button', { name: 'Perspective', exact: true }).click();
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await page.waitForTimeout(400);
  const bounds = await page.locator('canvas').boundingBox();
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2;
  const before = await page.evaluate(async () => {
    const { useEditor } = await import(
      performance
        .getEntriesByType('resource')
        .find((entry) => new URL(entry.name).pathname === '/src/store/editor.ts').name
    );
    return {
      object: useEditor.getState().project.objects[0],
      history: useEditor.getState().past.length,
    };
  });
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 65, y + 40, { steps: 12 });
  await page.mouse.up();
  const after = await page.evaluate(async () => {
    const { useEditor } = await import(
      performance
        .getEntriesByType('resource')
        .find((entry) => new URL(entry.name).pathname === '/src/store/editor.ts').name
    );
    return {
      object: useEditor.getState().project.objects[0],
      history: useEditor.getState().past.length,
    };
  });
  assert.notEqual(after.object.position.x, before.object.position.x);
  assert.equal(after.history, before.history + 1);
  assert.ok(
    Math.abs(after.object.position.x / 0.1 - Math.round(after.object.position.x / 0.1)) < 0.001,
  );
  assert.equal(after.object.position.y, 0.5);
  await page.getByLabel('Undo', { exact: true }).click();
  await page.getByRole('button', { name: /In this booth/ }).click();
  await page.getByRole('button', { name: 'Lock Counter', exact: true }).click();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 70, y + 20, { steps: 8 });
  await page.mouse.up();
  const locked = await page.evaluate(async () => {
    const { useEditor } = await import(
      performance
        .getEntriesByType('resource')
        .find((entry) => new URL(entry.name).pathname === '/src/store/editor.ts').name
    );
    return useEditor.getState().project.objects[0];
  });
  assert.equal(locked.position.x, 0);
  await page.getByRole('button', { name: 'Unlock Counter', exact: true }).click();
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await page.getByRole('button', { name: 'Front', exact: true }).click();
  await page.waitForTimeout(300);
  await page.mouse.move(x, y + 15);
  await page.mouse.down();
  await page.mouse.move(x + 60, y + 15, { steps: 10 });
  await page.mouse.up();
  const front = await page.evaluate(async () => {
    const { useEditor } = await import(
      performance
        .getEntriesByType('resource')
        .find((entry) => new URL(entry.name).pathname === '/src/store/editor.ts').name
    );
    return useEditor.getState().project.objects[0];
  });
  assert.notEqual(front.position.x, 0);
  assert.equal(front.position.z, 0);
  assert.equal(front.position.y, 0.5);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Meta+z');
  await expect(page.getByText('All changes saved')).toBeVisible();
  await page.getByRole('link', { name: 'Booth Studio home' }).click();
  await page
    .getByRole('button', { name: 'Duplicate project Drag verification', exact: true })
    .click();
  await expect(page.getByRole('button', { name: /Drag verification copy/ }).first()).toBeVisible();
  await page.getByLabel('Close dialog').click();
  await page.reload();
  await expect(page.locator('.project-dropdown>button').first()).toContainText('Drag verification');
  await expect(page.locator('.project-dropdown>button').first()).not.toContainText('copy');
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      checks: [
        'mouse drag on floor',
        '10 cm snapping',
        'one history entry per drag',
        'floor anchoring',
        'locked object cannot move',
        'front-view drag',
        'duplicate does not change active project',
      ],
      errors,
    }),
  );
} catch (e) {
  await page.screenshot({ path: '/tmp/booth-drag-failure.png' });
  throw e;
} finally {
  await browser.close();
}
