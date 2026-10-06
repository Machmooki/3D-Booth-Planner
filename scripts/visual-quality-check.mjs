import { chromium, expect as baseExpect } from '@playwright/test';
const expect = baseExpect.configure({ timeout: 15000 });
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
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
  acceptDownloads: true,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const checks = [];
await mkdir('/tmp/booth-visual-quality', { recursive: true });
const state = () =>
  page.evaluate(async () => {
    const { useEditor } = await import(
      performance
        .getEntriesByType('resource')
        .find((entry) => new URL(entry.name).pathname === '/src/store/editor.ts').name
    );
    return {
      project: useEditor.getState().project,
      past: useEditor.getState().past.length,
      transaction: !!useEditor.getState().transaction,
    };
  });
try {
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByText('All changes saved')).toBeVisible();
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/booth-visual-quality/default.png' });
  for (const [color, preset] of [
    ['Warm white', 'Matte'],
    ['Sand', 'Wood'],
    ['Muted sage', 'Concrete'],
    ['Charcoal', 'Carpet'],
  ]) {
    await page.getByRole('button', { name: `Floor ${color}`, exact: true }).click();
    await page
      .getByRole('group', { name: 'Floor material', exact: true })
      .getByRole('button', { name: preset, exact: true })
      .click();
    await expect(page.getByRole('button', { name: 'Grid', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.waitForTimeout(200);
    await page.screenshot({ path: `/tmp/booth-visual-quality/floor-${preset.toLowerCase()}.png` });
  }
  checks.push('four floor presets and independent contrasting grid');
  const before = (await state()).past;
  const picker = page.getByLabel('Custom floor color');
  for (const color of ['#d0c0a0', '#d1c1a1', '#d2c2a2', '#d3c3a3'])
    await picker.evaluate((el, color) => {
      el.value = color;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, color);
  await picker.dispatchEvent('change');
  assert.equal((await state()).past, before + 1);
  assert.equal((await state()).transaction, false);
  assert.equal((await state()).project.booth.floor.color, '#d3c3a3');
  checks.push('live color picker creates one history entry');
  await page.getByLabel('Undo', { exact: true }).click();
  assert.equal((await state()).project.booth.floor.color, '#424741');
  await page.getByLabel('Redo', { exact: true }).click();
  assert.equal((await state()).project.booth.floor.color, '#d3c3a3');
  await page.getByRole('switch', { name: 'Floor grid' }).click();
  await expect(page.getByRole('button', { name: 'Grid', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  checks.push('floor undo/redo and synchronized grid controls');
  await page.getByRole('button', { name: /In this booth/ }).click();
  await page.locator('.object-row-main').filter({ hasText: 'Chair' }).click();
  await page.getByLabel('Material', { exact: true }).selectOption('fabric');
  await page.getByRole('button', { name: 'Modern', exact: true }).click();
  await page.getByRole('button', { name: 'Object Sand', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  const saved = (await state()).project;
  await page.reload();
  await expect(page.getByText('All changes saved')).toBeVisible();
  assert.deepEqual((await state()).project, saved);
  checks.push('floor material/color/grid and furniture style survive reload');
  await page.getByRole('button', { name: /^Export/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  await (await download).saveAs('/tmp/booth-visual-quality/project.json');
  await page.getByLabel('Close dialog').click();
  await page.getByRole('link', { name: 'Booth Studio home' }).click();
  await page
    .getByLabel('Import project file')
    .setInputFiles('/tmp/booth-visual-quality/project.json');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const imported = (await state()).project;
  assert.deepEqual(imported.booth, saved.booth);
  assert.deepEqual(imported.objects, saved.objects);
  checks.push('visual configuration JSON round-trip');
  // A bounded furniture scene exercises every refined renderer and keeps the same workspace framing.
  await page.evaluate(async () => {
    const { useEditor } = await import(
      performance
        .getEntriesByType('resource')
        .find((entry) => new URL(entry.name).pathname === '/src/store/editor.ts').name
    );
    const { createProject, createObject } = await import('/src/domain/model.ts');
    const p = createProject('Material study', 6, 6);
    const types = [
      'counter',
      'table',
      'chair',
      'stool',
      'stand',
      'shelf',
      'tv',
      'plant',
      'light',
      'backdrop',
    ];
    p.booth.floor = { color: '#e9e4d9', material: 'concrete', gridEnabled: false };
    p.objects = types.map((type, i) => {
      const o = createObject(type);
      o.position.x = ((i % 4) - 1.5) * 1.35;
      o.position.z = (Math.floor(i / 4) - 1) * 1.7;
      if (type === 'chair') o.variant = 'modern';
      if (type === 'table') o.variant = 'rectangle';
      if (type === 'counter') o.material = 'wood';
      return o;
    });
    useEditor.getState().load(p);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/booth-visual-quality/furniture.png' });
  const stats = await page.evaluate(async () => {
    const { useEditor } = await import(
      performance
        .getEntriesByType('resource')
        .find((entry) => new URL(entry.name).pathname === '/src/store/editor.ts').name
    );
    const { createProject, createObject } = await import('/src/domain/model.ts');
    const p = createProject('40-object resource check', 3, 6);
    p.objects = Array.from({ length: 40 }, (_, i) => {
      const o = createObject(['chair', 'table', 'counter', 'stand'][i % 4]);
      o.position.x = ((i % 5) - 2) * 0.5;
      o.position.z = (Math.floor(i / 5) - 3.5) * 0.6;
      return o;
    });
    useEditor.getState().load(p);
    return true;
  });
  assert.equal(stats, true);
  await page.waitForTimeout(2500);
  const metrics = () =>
    page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const s = [..._roots.values()][0].store.getState();
      return {
        drawCalls: s.gl.info.render.calls,
        triangles: s.gl.info.render.triangles,
        textures: s.gl.info.memory.textures,
        geometries: s.gl.info.memory.geometries,
      };
    });
  const forty = await metrics();
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.evaluate(async () => {
      const { useEditor } = await import(
        performance
          .getEntriesByType('resource')
          .find((entry) => new URL(entry.name).pathname === '/src/store/editor.ts').name
      );
      const s = useEditor.getState();
      for (const object of s.project.objects) s.update(object.id, { material: 'metal' });
    });
    await page.waitForTimeout(1200);
    await page.evaluate(async () => {
      const { useEditor } = await import(
        performance
          .getEntriesByType('resource')
          .find((entry) => new URL(entry.name).pathname === '/src/store/editor.ts').name
      );
      const s = useEditor.getState();
      for (const object of s.project.objects)
        s.update(object.id, {
          material: object.type === 'table' ? 'wood' : object.type === 'chair' ? 'fabric' : 'matte',
        });
    });
    await page.waitForTimeout(2200);
  }
  const after = await metrics();
  assert.ok(after.textures <= forty.textures + 1);
  assert.ok(after.geometries <= forty.geometries + 2);
  checks.push('40-object scene and repeated material changes keep GPU resources bounded');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks, forty, after, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: '/tmp/booth-visual-quality/failure.png' });
  console.error({ checks, errors });
  throw error;
} finally {
  await browser.close();
}
