import { beforeEach, describe, expect, it } from 'vitest';
import {
  alignObject,
  cm,
  createObject,
  createProject,
  footprint,
  meters,
  migrateProject,
  overflow,
  parseProject,
  resizeObject,
  serializeProject,
  snapValue,
} from '../src/domain/model';
import { useEditor } from '../src/store/editor';
describe('real-world geometry', () => {
  it('converts between meters and centimeters without rounding drift', () => {
    expect(cm(3)).toBe(300);
    expect(meters(85)).toBe(0.85);
    expect(cm(0.1 + 0.2)).toBe(30);
  });
  it('snaps positive and negative coordinates to the selected grid', () => {
    expect(snapValue(0.86, 0.1)).toBeCloseTo(0.9);
    expect(snapValue(-0.86, 0.25)).toBe(-0.75);
    expect(snapValue(0.126, 0.01)).toBeCloseTo(0.13);
  });
  it('detects overflow using the rotated footprint', () => {
    const object = createObject('backdrop');
    object.position.x = 0.6;
    expect(overflow(object, createProject().booth)).toBeCloseTo(0.3);
    object.rotation = 90;
    expect(footprint(object).width).toBeCloseTo(0.1);
    expect(overflow(object, createProject().booth)).toBe(0);
    object.rotation = 45;
    expect(footprint(object).width).toBeCloseTo(2.5 / Math.sqrt(2));
  });
  it('warns when an object extends above the maximum height', () => {
    const object = resizeObject(createObject('box'), { width: 1, height: 3, depth: 1 });
    expect(overflow(object, createProject().booth)).toBe(0.5);
  });
  it('aligns against each wall with the correct rotation', () => {
    const booth = createProject().booth;
    const object = createObject('backdrop');
    const back = alignObject(object, booth, 'back');
    expect(back.position.z).toBe(-1.45);
    const left = alignObject(object, booth, 'left');
    expect(left.rotation).toBe(90);
    expect(left.position.x).toBeCloseTo(-1.45);
    expect(overflow(left, booth)).toBeCloseTo(0);
    const right = alignObject(object, booth, 'right');
    expect(right.rotation).toBe(-90);
    expect(right.position.x).toBeCloseTo(1.45);
  });
  it('keeps furniture on the floor on resize while preserving mounted TV height', () => {
    const chair = resizeObject(createObject('chair'), { width: 1, height: 1.6, depth: 1 });
    expect(chair.position.y).toBe(0.8);
    const tv = createObject('tv');
    expect(resizeObject(tv, { width: 2, height: 1, depth: 0.1 }).position.y).toBe(tv.position.y);
  });
  it('clamps invalid dimensions to object limits', () => {
    const box = resizeObject(createObject('box'), { width: -3, height: Infinity, depth: 100 });
    expect(box.dimensions).toEqual({ width: 0.02, height: 0.6, depth: 20 });
  });
});
describe('project files', () => {
  it('round-trips artwork and exact transforms', () => {
    const p = createProject();
    const o = createObject('backdrop');
    o.branding = { data: 'data:image/png;base64,aGVsbG8=', fit: 'fill' };
    o.position.x = 0.853;
    p.objects.push(o);
    expect(parseProject(serializeProject(p))).toEqual(p);
  });
  it('rejects corrupt JSON, unsupported versions, non-images and duplicate identities', () => {
    expect(() => parseProject('{')).toThrow('could not be read');
    const p = createProject();
    expect(() => migrateProject({ ...p, schemaVersion: 2 })).toThrow();
    const o = createObject('box');
    expect(() => migrateProject({ ...p, objects: [o, o] })).toThrow();
    expect(() =>
      migrateProject({
        ...p,
        objects: [{ ...o, branding: { data: 'javascript:alert(1)', fit: 'fit' } }],
      }),
    ).toThrow();
    expect(() => migrateProject({ ...p, booth: { ...p.booth, width: -1 } })).toThrow();
  });
});
describe('editor history', () => {
  beforeEach(() => useEditor.getState().load(createProject()));
  it('undoes and redoes adding and deleting an object', () => {
    const s = useEditor.getState();
    s.add('counter');
    const id = useEditor.getState().selected!;
    s.remove(id);
    expect(useEditor.getState().project.objects).toHaveLength(0);
    s.undo();
    expect(useEditor.getState().project.objects[0].id).toBe(id);
    s.redo();
    expect(useEditor.getState().project.objects).toHaveLength(0);
  });
  it('records a continuous drag as one history entry', () => {
    const s = useEditor.getState();
    s.add('counter');
    const id = useEditor.getState().selected!;
    s.begin();
    for (let i = 0; i < 100; i++) s.update(id, { position: { x: i / 100, y: 0.5, z: 0 } });
    s.end();
    expect(useEditor.getState().past).toHaveLength(2);
    s.undo();
    expect(useEditor.getState().project.objects[0].position.x).toBe(0);
    s.redo();
    expect(useEditor.getState().project.objects[0].position.x).toBe(0.99);
  });
  it('does not create an undo step for a click without movement', () => {
    const s = useEditor.getState();
    s.add('counter');
    s.begin();
    s.end();
    expect(useEditor.getState().past).toHaveLength(1);
  });
  it('clears redo history after a new edit', () => {
    const s = useEditor.getState();
    s.add('table');
    s.undo();
    s.add('chair');
    expect(useEditor.getState().future).toHaveLength(0);
  });
  it('respects locks and duplicates artwork independently', () => {
    const s = useEditor.getState();
    s.add('backdrop');
    const id = useEditor.getState().selected!;
    s.update(id, {
      locked: true,
      branding: { data: 'data:image/png;base64,aGVsbG8=', fit: 'fit' },
    });
    s.remove(id);
    expect(useEditor.getState().project.objects).toHaveLength(1);
    s.duplicate(id);
    const copy = useEditor.getState().project.objects[1];
    expect(copy.id).not.toBe(id);
    expect(copy.locked).toBe(false);
    s.update(copy.id, { branding: { data: 'data:image/png;base64,aGVsbG8=', fit: 'fill' } });
    expect(useEditor.getState().project.objects[0].branding?.fit).toBe('fit');
  });
  it('undoes booth size changes', () => {
    const s = useEditor.getState();
    s.commit(
      { ...s.project, booth: { ...s.project.booth, width: 6, height: 3, depth: 6 } },
      'Resize booth',
    );
    s.undo();
    expect(useEditor.getState().project.booth.width).toBe(3);
    s.redo();
    expect(useEditor.getState().project.booth.width).toBe(6);
  });
});
