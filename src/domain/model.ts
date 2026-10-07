import { z } from 'zod';
import { defaultFloor, floorMaterials, materialTypes } from './appearance';
import type { Material, FloorAppearance } from './appearance';
export type { Material } from './appearance';
export const objectTypes = [
  'backdrop',
  'wall',
  'counter',
  'table',
  'chair',
  'stool',
  'tv',
  'banner',
  'stand',
  'shelf',
  'plant',
  'light',
  'sign',
  'human',
  'box',
  'bangchakSign',
  'oilDisplayStand',
  'rollupBanner',
] as const;
export type ObjectType = (typeof objectTypes)[number];
export type Category =
  'All objects' | 'Structure' | 'Furniture' | 'Display' | 'Decoration' | 'Utility';
export type View = 'Perspective' | 'Top' | 'Front' | 'Left' | 'Right';
export type Dimensions = { width: number; height: number; depth: number };
export const variantTypes = [
  'solid',
  'open',
  'round',
  'square',
  'rectangle',
  'simple',
  'modern',
  'pedestal',
  'shelf',
  'withProducts',
  'withoutProducts',
] as const;
export type Variant = (typeof variantTypes)[number];
export interface BoothObject {
  id: string;
  type: ObjectType;
  name: string;
  dimensions: Dimensions;
  position: { x: number; y: number; z: number };
  rotation: number;
  color: string;
  material: Material;
  variant?: Variant;
  locked: boolean;
  visible: boolean;
  oilLabels?: string[];
  branding?: { data: string; fit: 'fit' | 'fill' | 'stretch' };
}
export const defaultOilLabels = ['UCO', 'TREATED UCO', 'SAF', 'B24', 'HVO'] as const;
export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  updatedAt: string;
  booth: Dimensions & { floor: FloorAppearance };
  objects: BoothObject[];
}
export interface Definition {
  name: string;
  category: Category;
  dimensions: Dimensions;
  min: Dimensions;
  max: Dimensions;
  color: string;
  material: Material;
  branding: boolean;
  mounted?: boolean;
  description: string;
  variants?: readonly { id: Variant; label: string }[];
  sizePresets?: readonly { label: string; dimensions: Dimensions }[];
  render: { mode: 'procedural' } | { mode: 'model'; url: string };
}
const dim = (width: number, height: number, depth: number) => ({ width, height, depth });
const define = (
  name: string,
  category: Category,
  dimensions: Dimensions,
  color: string,
  description: string,
  branding = false,
  mounted = false,
): Definition => ({
  name,
  category,
  dimensions,
  min: dim(0.02, 0.02, 0.02),
  max: dim(20, 10, 20),
  color,
  material: 'matte',
  branding,
  mounted,
  description,
  render: { mode: 'procedural' },
});
export const registry: Record<ObjectType, Definition> = {
  backdrop: define(
    'Backdrop',
    'Structure',
    dim(2.4, 2.2, 0.1),
    '#c9cec0',
    'Your brand, front and center',
    true,
  ),
  wall: define('Wall', 'Structure', dim(3, 2.5, 0.1), '#e8e5df', 'Define your space'),
  counter: {
    ...define('Counter', 'Furniture', dim(1.1, 1, 0.5), '#e6dfd2', 'A warm welcome', true),
    variants: [
      { id: 'solid', label: 'Solid' },
      { id: 'open', label: 'Open' },
    ],
  },
  table: {
    ...define('Table', 'Furniture', dim(0.85, 0.75, 0.85), '#c4aa8a', 'Room for conversation'),
    material: 'wood',
    variants: [
      { id: 'round', label: 'Round' },
      { id: 'square', label: 'Square' },
      { id: 'rectangle', label: 'Rectangle' },
    ],
  },
  chair: {
    ...define('Chair', 'Furniture', dim(0.48, 0.8, 0.52), '#b6b4a5', 'Take a seat'),
    material: 'fabric',
    variants: [
      { id: 'simple', label: 'Simple' },
      { id: 'modern', label: 'Modern' },
    ],
  },
  stool: define('Stool', 'Furniture', dim(0.4, 0.75, 0.4), '#bfa487', 'A little elevation'),
  tv: define(
    'TV screen',
    'Display',
    dim(1.2, 0.72, 0.07),
    '#333735',
    'Bring your story to life',
    true,
    true,
  ),
  banner: define('Banner panel', 'Display', dim(0.8, 2, 0.15), '#bdc4b4', 'Make a statement', true),
  stand: {
    ...define(
      'Display stand',
      'Display',
      dim(0.5, 0.95, 0.5),
      '#dedbd3',
      'Put products in the spotlight',
      true,
    ),
    variants: [
      { id: 'pedestal', label: 'Pedestal' },
      { id: 'shelf', label: 'Shelf' },
    ],
  },
  shelf: {
    ...define('Shelf', 'Furniture', dim(0.9, 1.8, 0.35), '#c3aa8c', 'Everything in its place'),
    material: 'wood',
  },
  plant: define('Plant', 'Decoration', dim(0.55, 1.25, 0.55), '#6f8061', 'A touch of green'),
  light: define('Floor light', 'Decoration', dim(0.4, 1.8, 0.4), '#494e48', 'A softer atmosphere'),
  sign: define(
    'Sign',
    'Decoration',
    dim(0.7, 0.5, 0.05),
    '#e4dfd2',
    'Say something memorable',
    true,
    true,
  ),
  human: define(
    'Human reference',
    'Utility',
    dim(0.46, 1.7, 0.3),
    '#a8aaa3',
    'See your booth at human scale',
  ),
  bangchakSign: {
    ...define(
      'Bangchak Sign',
      'Display',
      dim(2.6, 1.3, 0.55),
      '#f4f2eb',
      'Sculpted Bangchak monument with layered plinth',
      true,
    ),
    material: 'paint',
    min: dim(1.2, 0.7, 0.25),
    max: dim(5, 2.5, 1.2),
  },
  oilDisplayStand: {
    ...define(
      'Oil Display Stand',
      'Display',
      dim(2.8, 1.25, 0.65),
      '#f4f2eb',
      'Five fuel samples on a curved exhibition podium',
    ),
    material: 'paint',
    min: dim(1.5, 0.8, 0.4),
    max: dim(5, 2, 1.2),
    variants: [
      { id: 'withProducts', label: 'With products' },
      { id: 'withoutProducts', label: 'Podium only' },
    ],
  },
  rollupBanner: {
    ...define(
      'Roll-up Banner',
      'Display',
      dim(0.85, 2, 0.32),
      '#f3f0e7',
      'Portable banner with cassette, rear pole and stabilizing feet',
      true,
    ),
    min: dim(0.6, 1.6, 0.2),
    max: dim(1.2, 2.5, 0.5),
    sizePresets: [0.85, 1, 1.2].map((width) => ({
      label: `${width * 100} × 200`,
      dimensions: dim(width, 2, 0.32),
    })),
  },
  box: define('Custom box', 'Utility', dim(0.6, 0.6, 0.6), '#c4c2b9', 'Make it your own', true),
};
export const cm = (meters: number) => Math.round(meters * 1000) / 10;
export const meters = (centimeters: number) => centimeters / 100;
export const snapValue = (value: number, increment: number) =>
  Math.round(value / increment) * increment;
export const SCALE_THRESHOLDS = { small: 0.5, balanced: 0.75 };
export function footprint(object: BoothObject) {
  const rad = (object.rotation * Math.PI) / 180;
  return {
    width:
      Math.abs(Math.cos(rad)) * object.dimensions.width +
      Math.abs(Math.sin(rad)) * object.dimensions.depth,
    depth:
      Math.abs(Math.sin(rad)) * object.dimensions.width +
      Math.abs(Math.cos(rad)) * object.dimensions.depth,
  };
}
export function overflow(object: BoothObject, booth: Dimensions) {
  const f = footprint(object);
  return Math.max(
    0,
    Math.abs(object.position.x) + f.width / 2 - booth.width / 2,
    Math.abs(object.position.z) + f.depth / 2 - booth.depth / 2,
    object.position.y + object.dimensions.height / 2 - booth.height,
    object.dimensions.height / 2 - object.position.y,
  );
}
export function resizeObject(object: BoothObject, dimensions: Dimensions): BoothObject {
  const def = registry[object.type];
  const sized = Object.fromEntries(
    Object.entries(dimensions).map(([key, v]) => [
      key,
      Math.max(
        def.min[key as keyof Dimensions],
        Math.min(
          def.max[key as keyof Dimensions],
          Number.isFinite(v) ? v : object.dimensions[key as keyof Dimensions],
        ),
      ),
    ]),
  ) as Dimensions;
  return {
    ...object,
    dimensions: sized,
    position: { ...object.position, y: def.mounted ? object.position.y : sized.height / 2 },
  };
}
export function alignObject(
  object: BoothObject,
  booth: Dimensions,
  side: 'center' | 'back' | 'left' | 'right',
): BoothObject {
  const rotation =
    side === 'left' ? 90 : side === 'right' ? -90 : side === 'back' ? 0 : object.rotation;
  const f = footprint({ ...object, rotation });
  return {
    ...object,
    rotation,
    position: {
      ...object.position,
      x:
        side === 'left'
          ? -booth.width / 2 + f.width / 2
          : side === 'right'
            ? booth.width / 2 - f.width / 2
            : 0,
      z: side === 'back' ? -booth.depth / 2 + f.depth / 2 : 0,
    },
  };
}
export function createObject(type: ObjectType, index = 0): BoothObject {
  const def = registry[type];
  return {
    id: crypto.randomUUID(),
    type,
    name: def.name,
    dimensions: { ...def.dimensions },
    position: {
      x: (index % 3) * 0.1,
      y: def.mounted ? 1.5 : def.dimensions.height / 2,
      z: (index % 3) * 0.1,
    },
    rotation: 0,
    color: def.color,
    material: def.material,
    ...(def.variants ? { variant: def.variants[0].id } : {}),
    locked: false,
    visible: true,
  };
}

export function changeVariant(object: BoothObject, variant: Variant): BoothObject {
  if (!registry[object.type].variants?.some((v) => v.id === variant)) return object;
  let dimensions = object.dimensions;
  if (object.type === 'table') {
    if (variant === 'rectangle' && Math.abs(dimensions.width - dimensions.depth) < 0.001)
      dimensions = { ...dimensions, width: Math.min(20, dimensions.width * 1.5) };
    if (variant === 'square') dimensions = { ...dimensions, depth: dimensions.width };
  }
  return { ...object, variant, dimensions };
}
export function createProject(name = 'Untitled booth', width = 3, depth = 3): Project {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name,
    updatedAt: new Date().toISOString(),
    booth: { ...dim(width, 2.5, depth), floor: { ...defaultFloor } },
    objects: [],
  };
}
export function demoProject(): Project {
  const project = createProject('The considered space');
  const back = alignObject(createObject('backdrop'), project.booth, 'back');
  back.dimensions = dim(3, 2.4, 0.1);
  back.position.y = 1.2;
  back.color = '#bac4ad';
  const counter = createObject('counter');
  counter.position.x = -0.7;
  counter.position.z = 0.8;
  const table = createObject('table');
  table.position = { x: 0.77, y: 0.375, z: 0.23 };
  const chair = createObject('chair');
  chair.position.x = 0.88;
  chair.position.z = 0.92;
  chair.rotation = 180;
  const plant = createObject('plant');
  plant.position.x = -1.12;
  plant.position.z = -0.88;
  const stand = createObject('stand');
  stand.position.x = 1.12;
  stand.position.z = -1.02;
  project.objects = [back, counter, table, chair, plant, stand];
  return project;
}
const dimensionsSchema = z.object({
  width: z.number().min(0.02).max(20),
  height: z.number().min(0.02).max(10),
  depth: z.number().min(0.02).max(20),
});
const objectSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(objectTypes),
  name: z.string().trim().min(1).max(100),
  dimensions: dimensionsSchema,
  position: z.object({
    x: z.number().min(-100).max(100),
    y: z.number().min(-10).max(20),
    z: z.number().min(-100).max(100),
  }),
  rotation: z.number().min(-3600).max(3600),
  color: z.string().regex(/^#[\da-fA-F]{6}$/),
  material: z.enum(materialTypes),
  variant: z.enum(variantTypes).optional(),
  oilLabels: z.array(z.string().max(40)).length(5).optional(),
  locked: z.boolean(),
  visible: z.boolean(),
  branding: z
    .object({
      data: z
        .string()
        .max(8_000_000)
        .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),
      fit: z.enum(['fit', 'fill', 'stretch']),
    })
    .optional(),
});
export const projectSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    updatedAt: z.string().datetime(),
    booth: dimensionsSchema.extend({
      width: z.number().min(1).max(20),
      depth: z.number().min(1).max(20),
      height: z.number().min(1).max(10),
      floor: z
        .object({
          color: z.string().regex(/^#[\da-fA-F]{6}$/),
          material: z.enum(floorMaterials),
          gridEnabled: z.boolean(),
        })
        .default(() => ({ ...defaultFloor })),
    }),
    objects: z.array(objectSchema).max(300),
  })
  .superRefine((p, ctx) => {
    for (const o of p.objects)
      if (o.variant && !registry[o.type].variants?.some((v) => v.id === o.variant))
        ctx.addIssue({ code: 'custom', message: 'Unsupported furniture variant' });
    if (new Set(p.objects.map((o) => o.id)).size !== p.objects.length)
      ctx.addIssue({ code: 'custom', message: 'Object IDs must be unique' });
  });
export function migrateProject(input: unknown): Project {
  const result = projectSchema.safeParse(input);
  if (!result.success)
    throw new Error('This file is not a valid Booth Studio project (version 1).');
  return { ...result.data, objects: result.data.objects.map((o) => resizeObject(o, o.dimensions)) };
}
export function parseProject(text: string): Project {
  if (text.length > 30_000_000) throw new Error('Project files must be smaller than 30 MB.');
  try {
    return migrateProject(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error('This file could not be read. Choose a Booth Studio JSON file.');
    throw error;
  }
}
export function serializeProject(project: Project) {
  return JSON.stringify(project, null, 2);
}
