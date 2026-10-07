import { chromium, expect as baseExpect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const expect = baseExpect.configure({ timeout: 15000 });
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
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const checks = [];
await mkdir('/tmp/booth-exhibition', { recursive: true });
async function editor(action, data) {
  return page.evaluate(
    async ({ action, data }) => {
      const { useEditor } = await import(
        performance
          .getEntriesByType('resource')
          .find((e) => new URL(e.name).pathname === '/src/store/editor.ts').name
      );
      const s = useEditor.getState();
      if (action === 'state')
        return { project: s.project, past: s.past.length, selected: s.selected };
      if (action === 'load') s.load(data);
      if (action === 'select') s.select(data);
      if (action === 'update') s.update(data.id, data.patch);
      if (action === 'remove') s.remove(data);
      if (action === 'duplicates') for (let i = 0; i < data.count; i++) s.duplicate(data.id);
      if (action === 'clear') {
        const { createProject } = await import('/src/domain/model.ts');
        s.load(createProject('Exhibition acceptance', 6, 6));
      }
    },
    { action, data },
  );
}
async function metrics() {
  return page.evaluate(async () => {
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
    const s = [..._roots.values()][0].store.getState();
    return {
      calls: s.gl.info.render.calls,
      triangles: s.gl.info.render.triangles,
      textures: s.gl.info.memory.textures,
      geometries: s.gl.info.memory.geometries,
    };
  });
}
try {
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByText('All changes saved')).toBeVisible();
  await editor('clear');
  for (const [name, type] of [
    ['Bangchak Sign', 'bangchakSign'],
    ['Oil Display Stand', 'oilDisplayStand'],
    ['Roll-up Banner', 'rollupBanner'],
  ]) {
    await page.getByLabel('Search objects').fill(name);
    await page.getByRole('button', { name: new RegExp(`^${name} `) }).click();
    await expect(page.getByLabel('Object name', { exact: true })).toHaveValue(name);
    const state = await editor('state');
    const o = state.project.objects.at(-1);
    assert.equal(o.type, type);
    await page.getByLabel('Rotation', { exact: true }).fill('30');
    await page.getByLabel('Rotation', { exact: true }).press('Enter');
    await page.getByLabel('Undo', { exact: true }).click();
    assert.equal((await editor('state')).project.objects.at(-1).rotation, 0);
    await page.getByLabel('Redo', { exact: true }).click();
    assert.equal((await editor('state')).project.objects.at(-1).rotation, 30);
    await editor('select', o.id);
    await page.getByLabel('Width', { exact: true }).fill(type === 'rollupBanner' ? '100' : '300');
    await page.getByLabel('Width', { exact: true }).press('Enter');
    await page.getByRole('button', { name: /Duplicate ⌘D/ }).click();
    assert.equal((await editor('state')).project.objects.at(-1).type, type);
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByLabel('Undo', { exact: true }).click();
    assert.equal((await editor('state')).project.objects.at(-1).type, type);
    await page.getByLabel('Redo', { exact: true }).click();
    checks.push(`${type}: library add, resize, rotate, duplicate, delete and history`);
  }
  await page.getByLabel('Search objects').fill('');
  let objects = (await editor('state')).project.objects;
  const rollup = objects.find((o) => o.type === 'rollupBanner'),
    oil = objects.find((o) => o.type === 'oilDisplayStand'),
    sign = objects.find((o) => o.type === 'bangchakSign');
  await editor('select', rollup.id);
  await page.getByRole('button', { name: '120 × 200', exact: true }).click();
  assert.equal(
    (await editor('state')).project.objects.find((o) => o.id === rollup.id).dimensions.width,
    1.2,
  );
  await page.getByLabel('Undo', { exact: true }).click();
  assert.equal(
    (await editor('state')).project.objects.find((o) => o.id === rollup.id).dimensions.width,
    1,
  );
  await editor('select', rollup.id);
  const art = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 425;
      c.height = 1000;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#c24f34';
      ctx.fillRect(0, 0, 425, 1000);
      ctx.fillStyle = 'white';
      ctx.font = '40px Arial';
      ctx.fillText('EXHIBITION', 70, 230);
      return c.toDataURL().split(',')[1];
    }),
    'base64',
  );
  await page
    .getByLabel('Upload artwork file')
    .setInputFiles({ name: 'exhibition.png', mimeType: 'image/png', buffer: art });
  await expect(page.getByAltText('Uploaded artwork')).toBeVisible();
  await page.getByRole('button', { name: 'fill', exact: true }).click();
  checks.push('roll-up size presets, preset undo, artwork upload and fit');
  await editor('select', sign.id);
  await page
    .getByLabel('Upload artwork file')
    .setInputFiles({ name: 'sign.png', mimeType: 'image/png', buffer: art });
  await expect(page.getByAltText('Uploaded artwork')).toBeVisible();
  await page.getByLabel('Undo', { exact: true }).click();
  assert.equal(
    (await editor('state')).project.objects.find((o) => o.id === sign.id).branding,
    undefined,
  );
  checks.push('sign artwork override and undo to built-in branding');
  await editor('select', oil.id);
  const names = ['น้ำมันใช้แล้ว', 'TREATED UCO', 'SAF B100', '', 'HVO'];
  const historyBeforeNames = (await editor('state')).past;
  for (let index = 0; index < names.length; index++) {
    await page.getByLabel(`Oil name ${index + 1}`, { exact: true }).fill(names[index]);
    await page.getByLabel(`Oil name ${index + 1}`, { exact: true }).press('Enter');
  }
  assert.deepEqual(
    (await editor('state')).project.objects.find((o) => o.id === oil.id).oilLabels,
    names,
  );
  assert.equal((await editor('state')).past, historyBeforeNames + 3);
  await page.getByLabel('Undo', { exact: true }).click();
  assert.equal(
    (await editor('state')).project.objects.find((o) => o.id === oil.id).oilLabels[3],
    'B24',
  );
  await page.getByLabel('Redo', { exact: true }).click();
  checks.push('editable oil names: Unicode, blank labels and one undo entry per committed field');
  await editor('select', oil.id);
  await page.getByRole('button', { name: 'Podium only', exact: true }).click();
  assert.equal(
    (await editor('state')).project.objects.find((o) => o.id === oil.id).variant,
    'withoutProducts',
  );
  await page.getByLabel('Undo', { exact: true }).click();
  assert.equal(
    (await editor('state')).project.objects.find((o) => o.id === oil.id).variant,
    'withProducts',
  );
  await editor('select', oil.id);
  await page.getByRole('button', { name: 'Podium only', exact: true }).click();
  checks.push('oil product visibility variant and history');
  await expect(page.getByText('All changes saved')).toBeVisible();
  const saved = (await editor('state')).project;
  await page.reload();
  await expect(page.getByText('All changes saved')).toBeVisible();
  assert.deepEqual((await editor('state')).project, saved);
  await page.getByRole('button', { name: /^Export/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  await (await download).saveAs('/tmp/booth-exhibition/project.json');
  await page.getByLabel('Close dialog').click();
  await page.getByRole('link', { name: 'Booth Studio home' }).click();
  await page.getByLabel('Import project file').setInputFiles('/tmp/booth-exhibition/project.json');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const imported = (await editor('state')).project;
  assert.deepEqual(imported.objects, saved.objects);
  assert.deepEqual(imported.booth, saved.booth);
  checks.push(
    'browser persistence and exported/imported JSON preserve all new objects and artwork',
  );
  // Inspect actual rendered bounds at both extremes, including feet, cards and vessels.
  await editor('load', saved);
  for (const extreme of ['min', 'max']) {
    await page.evaluate(async (extreme) => {
      const { useEditor } = await import(
        performance
          .getEntriesByType('resource')
          .find((e) => new URL(e.name).pathname === '/src/store/editor.ts').name
      );
      const { registry } = await import('/src/domain/model.ts');
      const s = useEditor.getState();
      for (const o of s.project.objects) {
        s.resize(o.id, registry[o.type][extreme]);
        s.update(o.id, {
          rotation: 0,
          variant: o.type === 'oilDisplayStand' ? 'withProducts' : undefined,
        });
      }
    }, extreme);
    await page.waitForTimeout(1200);
    const bounds = await page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { Box3, Vector3 } = await import('/node_modules/.vite/deps/three.js');
      const s = [..._roots.values()][0].store.getState();
      s.scene.updateMatrixWorld(true);
      const output = [];
      s.scene.traverse((o) => {
        if (o.name.startsWith('booth-model:')) {
          const box = new Box3().setFromObject(o);
          output.push({
            id: o.name.slice(12),
            size: box.getSize(new Vector3()).toArray(),
            bottom: box.min.y,
          });
        }
      });
      return output;
    });
    const actual = (await editor('state')).project;
    for (const b of bounds) {
      const o = actual.objects.find((o) => o.id === b.id);
      assert.ok(o);
      const d = o.dimensions;
      assert.ok(b.size[0] <= d.width + 0.002, JSON.stringify(b));
      assert.ok(b.size[1] <= d.height + 0.002);
      assert.ok(b.size[2] <= d.depth + 0.002);
      assert.ok(Math.abs(b.bottom) < 0.002);
    }
    assert.equal(bounds.length, 3);
  }
  checks.push(
    'rendered geometry stays inside dimensions and rests on floor at minimum/maximum sizes',
  );
  await editor('load', saved);
  await editor('update', { id: oil.id, patch: { variant: 'withProducts' } });
  await page.waitForTimeout(2500);
  const baseline = await metrics();
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const id of [sign.id, oil.id, rollup.id]) await editor('duplicates', { id, count: 4 });
    await page.waitForTimeout(1800);
    if (cycle === 0) checks.push({ fifteenObjects: await metrics() });
    const copies = (await editor('state')).project.objects.filter(
      (o) => ![sign.id, oil.id, rollup.id].includes(o.id),
    );
    for (const copy of copies) await editor('remove', copy.id);
    await page.waitForTimeout(2200);
    console.log('Resource cycle', cycle, await metrics());
  }
  const after = await metrics();
  console.log({ baseline, after });
  assert.ok(after.textures <= baseline.textures + 1);
  assert.ok(after.geometries <= baseline.geometries + 2);
  checks.push({ resourceReuse: { baseline, after } });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks, errors }, null, 2));
} catch (e) {
  await page.screenshot({ path: '/tmp/booth-exhibition/failure.png' });
  console.error({ checks, errors });
  throw e;
} finally {
  await browser.close();
}
