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
const state = () =>
  page.evaluate(async () => {
    const { useEditor } = await import(
      performance
        .getEntriesByType('resource')
        .find((e) => new URL(e.name).pathname === '/src/store/editor.ts').name
    );
    const s = useEditor.getState();
    return { object: s.project.objects[0], history: s.past.length };
  });
try {
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByText('All changes saved')).toBeVisible();
  for (const type of ['bangchakSign', 'oilDisplayStand', 'rollupBanner']) {
    await page.evaluate(async (type) => {
      const { useEditor } = await import(
        performance
          .getEntriesByType('resource')
          .find((e) => new URL(e.name).pathname === '/src/store/editor.ts').name
      );
      const { createObject, createProject } = await import('/src/domain/model.ts');
      const p = createProject();
      p.objects = [createObject(type)];
      useEditor.getState().load(p);
      useEditor.setState({ view: 'Front' });
    }, type);
    await page.waitForTimeout(600);
    const point = await page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { Vector3 } = await import('/node_modules/.vite/deps/three.js');
      const s = [..._roots.values()][0].store.getState();
      const b = s.gl.domElement.getBoundingClientRect();
      const v = new Vector3(0, 0.5, 0).project(s.camera);
      return { x: b.x + ((v.x + 1) * b.width) / 2, y: b.y + ((1 - v.y) * b.height) / 2 };
    });
    const before = await state();
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 65, point.y, { steps: 10 });
    await page.mouse.up();
    const after = await state();
    assert.notEqual(after.object.position.x, before.object.position.x, type);
    assert.equal(after.object.position.y, after.object.dimensions.height / 2);
    assert.equal(after.history, before.history + 1);
    await page.getByLabel('Undo', { exact: true }).click();
    assert.equal((await state()).object.position.x, 0);
    console.log(
      `${type}: pointer selection, snapped drag, floor anchoring and one-step undo passed`,
    );
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
