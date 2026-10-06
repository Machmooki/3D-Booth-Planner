import { create } from 'zustand';
import type { FloorAppearance } from '../domain/appearance';
import { alignObject, createObject, demoProject, resizeObject } from '../domain/model';
import type { BoothObject, Dimensions, ObjectType, Project, View } from '../domain/model';
type Snapshot = { project: Project; label: string };
interface EditorState {
  project: Project;
  selected: string | null;
  past: Snapshot[];
  future: Snapshot[];
  transaction: Project | null;
  ready: boolean;
  view: View;
  cameraTick: number;
  dimensions: boolean;
  human: boolean;
  snap: boolean;
  step: number;
  tool: 'select' | 'measure';
  saveStatus: 'saved' | 'saving' | 'error';
  notice: string;
  exporting: boolean;
  load: (project: Project) => void;
  commit: (project: Project, label: string) => void;
  add: (type: ObjectType) => void;
  update: (id: string, patch: Partial<BoothObject>, label?: string) => void;
  resize: (id: string, dimensions: Dimensions) => void;
  align: (id: string, side: 'center' | 'back' | 'left' | 'right') => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  setFloor: (patch: Partial<FloorAppearance>) => void;
  begin: (label?: string) => void;
  transactionLabel: string;
  end: () => void;
  undo: () => void;
  redo: () => void;
  select: (id: string | null) => void;
  notify: (text: string) => void;
}
let preference: { snap?: boolean; step?: number; grid?: boolean } = {};
try {
  preference = JSON.parse(localStorage.getItem('booth-preferences') || '{}');
} catch {
  /* Defaults remain usable when storage is blocked. */
}
export const useEditor = create<EditorState>((set, get) => ({
  project: demoProject(),
  selected: null,
  past: [],
  future: [],
  transaction: null,
  transactionLabel: 'Move object',
  ready: false,
  view: 'Perspective',
  cameraTick: 0,
  dimensions: true,
  human: false,
  snap: preference.snap ?? true,
  step: [0.01, 0.05, 0.1, 0.25, 0.5].includes(preference.step ?? 0) ? preference.step! : 0.1,
  tool: 'select',
  saveStatus: 'saved',
  notice: '',
  exporting: false,
  load: (project) =>
    set({
      project,
      selected: null,
      past: [],
      future: [],
      transaction: null,
      ready: true,
      saveStatus: 'saved',
    }),
  commit: (project, label) => {
    const s = get();
    set({
      project: { ...project, updatedAt: new Date().toISOString() },
      past: s.transaction ? s.past : [...s.past.slice(-59), { project: s.project, label }],
      future: [],
      saveStatus: 'saving',
    });
  },
  add: (type) => {
    const s = get();
    if (s.project.objects.length >= 300) {
      s.notify('This project has reached the 300 object limit.');
      return;
    }
    const object = createObject(type, s.project.objects.length);
    s.commit({ ...s.project, objects: [...s.project.objects, object] }, `Add ${object.name}`);
    set({ selected: object.id, tool: 'select' });
  },
  update: (id, patch, label = 'Edit object') => {
    const s = get();
    const original = s.project.objects.find((o) => o.id === id);
    if (!original || (original.locked && patch.locked !== false && patch.visible === undefined))
      return;
    s.commit(
      {
        ...s.project,
        objects: s.project.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      },
      label,
    );
  },
  resize: (id, dimensions) => {
    const s = get();
    const object = s.project.objects.find((o) => o.id === id);
    if (object) s.update(id, resizeObject(object, dimensions), 'Resize object');
  },
  align: (id, side) => {
    const s = get();
    const object = s.project.objects.find((o) => o.id === id);
    if (object) s.update(id, alignObject(object, s.project.booth, side), 'Position object');
  },
  remove: (id) => {
    const s = get();
    if (s.project.objects.find((o) => o.id === id)?.locked) {
      s.notify('Unlock this object to delete it.');
      return;
    }
    s.commit(
      { ...s.project, objects: s.project.objects.filter((o) => o.id !== id) },
      'Delete object',
    );
    set({ selected: null });
  },
  duplicate: (id) => {
    const s = get();
    const o = s.project.objects.find((o) => o.id === id);
    if (!o) return;
    if (s.project.objects.length >= 300) {
      s.notify('This project has reached the 300 object limit.');
      return;
    }
    const copy = {
      ...o,
      id: crypto.randomUUID(),
      name: `${o.name.slice(0, 90)} copy`,
      locked: false,
      position: { ...o.position, x: o.position.x + 0.15, z: o.position.z + 0.15 },
    };
    s.commit({ ...s.project, objects: [...s.project.objects, copy] }, 'Duplicate object');
    set({ selected: copy.id });
  },
  setFloor: (patch) => {
    const s = get();
    s.commit(
      {
        ...s.project,
        booth: { ...s.project.booth, floor: { ...s.project.booth.floor, ...patch } },
      },
      'Change floor',
    );
  },
  begin: (label = 'Move object') => {
    if (!get().transaction) set({ transaction: get().project, transactionLabel: label });
  },
  end: () => {
    const s = get();
    if (!s.transaction) return;
    set({
      past:
        s.transaction === s.project
          ? s.past
          : [...s.past.slice(-59), { project: s.transaction, label: s.transactionLabel }],
      transaction: null,
    });
  },
  undo: () => {
    const s = get();
    const last = s.past.at(-1);
    if (last)
      set({
        project: { ...last.project, updatedAt: new Date().toISOString() },
        past: s.past.slice(0, -1),
        future: [...s.future, { project: s.project, label: last.label }],
        selected: null,
        saveStatus: 'saving',
      });
  },
  redo: () => {
    const s = get();
    const next = s.future.at(-1);
    if (next)
      set({
        project: { ...next.project, updatedAt: new Date().toISOString() },
        future: s.future.slice(0, -1),
        past: [...s.past, { project: s.project, label: next.label }],
        selected: null,
        saveStatus: 'saving',
      });
  },
  select: (selected) => set({ selected }),
  notify: (notice) => set({ notice }),
}));
useEditor.subscribe((s, p) => {
  if (s.snap !== p.snap || s.step !== p.step)
    try {
      localStorage.setItem('booth-preferences', JSON.stringify({ snap: s.snap, step: s.step }));
    } catch {
      /* Preferences are optional. */
    }
});
