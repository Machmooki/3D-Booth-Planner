import { chromium } from '@playwright/test';
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
const page = await browser.newPage({ viewport: { width: 1600, height: 1050 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await mkdir('/tmp/booth-exhibition', { recursive: true });
await page.goto('http://127.0.0.1:5173');
await page.getByText('All changes saved').waitFor();
await page.getByLabel('Object category').selectOption('Display');
for (const type of ['bangchakSign', 'oilDisplayStand', 'rollupBanner', 'all']) {
  await page.evaluate(async (type) => {
    const { useEditor } = await import(
      performance
        .getEntriesByType('resource')
        .find((e) => new URL(e.name).pathname === '/src/store/editor.ts').name
    );
    const { createProject, createObject } = await import('/src/domain/model.ts');
    const p = createProject(
      'Exhibition collection',
      type === 'all' ? 6 : 3,
      type === 'all' ? 6 : 3,
    );
    p.booth.floor.gridEnabled = false;
    p.objects = (type === 'all' ? ['bangchakSign', 'oilDisplayStand', 'rollupBanner'] : [type]).map(
      (t, i) => {
        const o = createObject(t);
        if (type === 'all') {
          o.position.x = [-1.4, 1.25, -1.85][i];
          o.position.z = [1.2, -1.1, -1.7][i];
        }
        return o;
      },
    );
    useEditor.getState().load(p);
    useEditor.setState({ dimensions: false, human: false, view: 'Perspective' });
  }, type);
  await page.waitForTimeout(1000);
  await page.evaluate(async (type) => {
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
    const s = [..._roots.values()][0].store.getState();
    s.controls.target.set(0, type === 'rollupBanner' ? 1 : 0.65, 0);
    s.camera.position.set(
      ...(type === 'all'
        ? [8, 6.2, 10]
        : type === 'rollupBanner'
          ? [2.4, 2.2, 5.5]
          : [3, 2.4, 5.8]),
    );
    s.controls.update();
    s.invalidate();
  }, type);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `/tmp/booth-exhibition/${type}.png` });
}
console.log({ errors });
await browser.close();
