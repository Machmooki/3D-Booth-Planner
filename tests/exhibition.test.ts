import { beforeEach, describe, expect, it } from 'vitest';
import {
  changeVariant,
  createObject,
  createProject,
  migrateProject,
  parseProject,
  registry,
  serializeProject,
} from '../src/domain/model';
import { useEditor } from '../src/store/editor';
import { podiumGeometry, signGeometry } from '../src/scene/exhibitionGeometry';
const types = ['bangchakSign', 'oilDisplayStand', 'rollupBanner'] as const;
describe('exhibition object integration', () => {
  beforeEach(() => useEditor.getState().load(createProject()));
  it.each(types)('%s survives editing, history, copying and JSON round-trip', (type) => {
    const s = useEditor.getState();
    s.add(type);
    const id = useEditor.getState().selected!;
    const original = useEditor.getState().project.objects[0];
    s.begin();
    for (let i = 0; i < 10; i++) s.update(id, { position: { ...original.position, x: i / 10 } });
    s.end();
    expect(useEditor.getState().past).toHaveLength(2);
    s.update(id, { rotation: 90 });
    s.resize(id, { ...original.dimensions, width: original.dimensions.width * 1.1 });
    const resized = useEditor.getState().project.objects[0];
    expect(resized.position.y).toBe(resized.dimensions.height / 2);
    s.undo();
    expect(useEditor.getState().project.objects[0].dimensions).toEqual(original.dimensions);
    s.redo();
    expect(useEditor.getState().project.objects[0]).toEqual(resized);
    s.duplicate(id);
    const copy = useEditor.getState().project.objects[1];
    expect(copy.id).not.toBe(id);
    expect(copy.type).toBe(type);
    expect(copy.dimensions).toEqual(resized.dimensions);
    const p = useEditor.getState().project;
    expect(parseProject(serializeProject(p))).toEqual(p);
    s.remove(id);
    expect(useEditor.getState().project.objects).toHaveLength(1);
    s.undo();
    expect(useEditor.getState().project.objects).toHaveLength(2);
    s.redo();
    expect(useEditor.getState().project.objects).toHaveLength(1);
  });
  it('preserves podium options and artwork without Three resources in serialized state', () => {
    const p = createProject();
    p.objects = types.map((t) => createObject(t));
    p.objects[1] = changeVariant(p.objects[1], 'withoutProducts');
    p.objects[2].branding = { data: 'data:image/png;base64,aGVsbG8=', fit: 'fill' };
    const json = serializeProject(p);
    expect(parseProject(json)).toEqual(p);
    expect(json).not.toMatch(/geometry|texture|materialuuid/i);
    expect(() =>
      migrateProject({ ...p, objects: [{ ...p.objects[0], variant: 'withProducts' }] }),
    ).toThrow();
  });
  it('keeps existing banner projects compatible and presets within physical limits', () => {
    const p = createProject();
    p.objects = [createObject('banner')];
    expect(parseProject(serializeProject(p))).toEqual(p);
    const s = useEditor.getState();
    s.add('rollupBanner');
    const id = useEditor.getState().selected!;
    for (const preset of registry.rollupBanner.sizePresets!) {
      s.resize(id, preset.dimensions);
      expect(useEditor.getState().project.objects[0].dimensions).toEqual(preset.dimensions);
    }
    s.undo();
    expect(useEditor.getState().project.objects[0].dimensions.width).toBe(1);
  });
});
describe('curved exhibition geometry', () => {
  it.each([podiumGeometry, signGeometry])(
    'keeps physical bounds including thin layered plinths',
    (build) => {
      for (const [w, h, d] of [
        [2.8, 0.04, 0.65],
        [1.2, 0.7, 0.25],
        [5, 2.5, 1.2],
      ]) {
        const g = build(w, h, d);
        g.computeBoundingBox();
        const b = g.boundingBox!;
        expect(b.max.x - b.min.x).toBeCloseTo(w, 5);
        expect(b.max.y - b.min.y).toBeCloseTo(h, 5);
        expect(b.max.z - b.min.z).toBeCloseTo(d, 5);
        expect(b.min.y).toBeCloseTo(-h / 2, 5);
        expect(g.attributes.position.count).toBeLessThan(5000);
        g.dispose();
      }
    },
  );
});

describe('custom oil names', () => {
  it('preserves blank and Unicode names through history, duplication and JSON', () => {
    const s = useEditor.getState();
    s.load(createProject());
    s.add('oilDisplayStand');
    const id = useEditor.getState().selected!;
    const oilLabels = ['น้ำมันใช้แล้ว', '', 'SAF B100', 'Jet fuel', 'HVO'];
    s.update(id, { oilLabels }, 'Change oil names');
    s.undo();
    expect(useEditor.getState().project.objects[0].oilLabels).toBeUndefined();
    s.redo();
    s.duplicate(id);
    const p = useEditor.getState().project;
    expect(p.objects[1].oilLabels).toEqual(oilLabels);
    expect(parseProject(serializeProject(p)).objects[1].oilLabels).toEqual(oilLabels);
    s.update(p.objects[1].id, { oilLabels: ['Changed', ...oilLabels.slice(1)] });
    expect(useEditor.getState().project.objects[0].oilLabels).toEqual(oilLabels);
  });
  it('accepts existing podium projects and rejects malformed label arrays', () => {
    const p = createProject();
    p.objects = [createObject('oilDisplayStand')];
    expect(parseProject(serializeProject(p)).objects[0].oilLabels).toBeUndefined();
    for (const oilLabels of [['A'], Array(5).fill('x'.repeat(41)), [1, 2, 3, 4, 5]]) {
      expect(() => migrateProject({ ...p, objects: [{ ...p.objects[0], oilLabels }] })).toThrow();
    }
  });
});
