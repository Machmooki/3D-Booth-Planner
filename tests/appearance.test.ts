import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateTextureRepeat,
  defaultFloor,
  gridColor,
  materialTypes,
} from '../src/domain/appearance';
import {
  changeVariant,
  createObject,
  createProject,
  parseProject,
  serializeProject,
} from '../src/domain/model';
import { useEditor } from '../src/store/editor';
describe('visual configuration compatibility', () => {
  it('opens old v1 projects with safe floor defaults and unchanged furniture/artwork', () => {
    const project = createProject();
    const object = createObject('counter');
    object.branding = { data: 'data:image/png;base64,aGVsbG8=', fit: 'fill' };
    const old = {
      ...project,
      booth: { width: 3, height: 2.5, depth: 3 },
      objects: [{ ...object, variant: undefined }],
    };
    const restored = parseProject(JSON.stringify(old));
    expect(restored.booth.floor).toEqual(defaultFloor);
    expect(restored.objects[0].branding).toEqual(object.branding);
    expect(restored.objects[0].dimensions).toEqual(object.dimensions);
  });
  it('round-trips all floor/object visual configuration', () => {
    const project = createProject();
    project.booth.floor = { color: '#424741', material: 'carpet', gridEnabled: false };
    const chair = createObject('chair');
    chair.material = 'fabric';
    chair.variant = 'modern';
    project.objects = [chair];
    expect(parseProject(serializeProject(project))).toEqual(project);
  });
  it('accepts curated materials and rejects invalid floor/variant data', () => {
    for (const material of materialTypes) {
      const p = createProject();
      p.objects = [{ ...createObject('box'), material }];
      expect(parseProject(serializeProject(p)).objects[0].material).toBe(material);
    }
    const p = createProject();
    expect(() =>
      parseProject(
        JSON.stringify({
          ...p,
          booth: { ...p.booth, floor: { ...defaultFloor, material: 'lava' } },
        }),
      ),
    ).toThrow();
    expect(() =>
      parseProject(
        JSON.stringify({ ...p, objects: [{ ...createObject('chair'), variant: 'round' }] }),
      ),
    ).toThrow();
  });
  it('chooses readable independent grid colors on dark and light floors', () => {
    expect(gridColor('#424741')).not.toBe(gridColor('#f2eee5'));
    expect(gridColor('#000000')).toBe('#aeb6a7');
    expect(gridColor('#ffffff')).toBe('#939487');
  });
  it('scales texture repeats with physical dimensions rather than stretching', () => {
    expect(calculateTextureRepeat(3, 6, 0.6)).toEqual([5, 10]);
    expect(calculateTextureRepeat(6, 6, 0.6)).toEqual([10, 10]);
    expect(() => calculateTextureRepeat(3, 3, 0)).toThrow();
  });
  it('gives table variants real shapes within editable dimensions', () => {
    const table = createObject('table');
    const rectangle = changeVariant(table, 'rectangle');
    expect(rectangle.dimensions.width).toBeCloseTo(1.275);
    expect(rectangle.dimensions.depth).toBe(0.85);
    expect(changeVariant(rectangle, 'square').dimensions.depth).toBeCloseTo(1.275);
    expect(changeVariant(table, 'modern')).toBe(table);
  });
});
describe('appearance history', () => {
  beforeEach(() => useEditor.getState().load(createProject()));
  it('undoes and redoes floor color, material and grid independently', () => {
    const s = useEditor.getState();
    s.setFloor({ color: '#424741' });
    s.setFloor({ material: 'wood' });
    s.setFloor({ gridEnabled: false });
    s.undo();
    expect(useEditor.getState().project.booth.floor).toEqual({
      color: '#424741',
      material: 'wood',
      gridEnabled: true,
    });
    s.undo();
    expect(useEditor.getState().project.booth.floor.material).toBe('matte');
    s.redo();
    expect(useEditor.getState().project.booth.floor.material).toBe('wood');
  });
  it('groups a continuous color edit into one operation', () => {
    const s = useEditor.getState();
    s.begin('Change floor color');
    for (let i = 0; i < 60; i++) s.setFloor({ color: `#${(0x808000 + i).toString(16)}` });
    s.end();
    expect(useEditor.getState().past).toHaveLength(1);
    expect(useEditor.getState().past[0].label).toBe('Change floor color');
    s.undo();
    expect(useEditor.getState().project.booth.floor).toEqual(defaultFloor);
  });
  it('preserves branded artwork when changing material or variant and undoing', () => {
    const s = useEditor.getState();
    s.add('counter');
    const id = useEditor.getState().selected!;
    s.update(id, { branding: { data: 'data:image/png;base64,aGVsbG8=', fit: 'fit' } });
    s.update(id, { material: 'metal', variant: 'open' });
    s.undo();
    expect(useEditor.getState().project.objects[0].material).toBe('matte');
    expect(useEditor.getState().project.objects[0].branding?.fit).toBe('fit');
    s.redo();
    expect(useEditor.getState().project.objects[0].variant).toBe('open');
  });
});
