# Booth Studio

A local-first, real-scale 3D exhibition booth planner, built from `../docs/build.md`.

## Run locally

Node.js 22.12+ (or Node.js 24) is recommended.

```sh
npm install
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm run test   # geometry, serialization, validation, history
npm run lint`
npm run build  # strict TypeScript + production assets in dist/
npm run preview
```
`
## What you can do

- Create, rename, duplicate, delete, and switch between local projects.
- Set a preset or custom booth footprint and height in centimeters.
- Customize floor colors and Matte, Wood, Concrete or Carpet finishes, with an independent contrasting grid.
- Choose curated furniture materials and compact table, chair, counter and stand style variants. These settings save, export and support Undo/Redo.
- Add 18 reusable object types, including Bangchak Sign, Oil Display Stand and a detailed Roll-up Banner, alongside the original library of backdrops, counters, tables, chairs, TV screens, plants, and a human reference.
- Select and drag objects along the floor, use exact dimensions, rotate, snap, align to walls, lock, and hide objects.
- See rotated footprint and maximum height warnings without blocking intentional overflow.
- Switch between perspective and orthographic top, front, left, and right views.
- Measure between two floor points, toggle the grid, dimensions, and a 170 cm scale reference. Add an editable human object for other heights.
- Upload PNG, JPEG, or WebP artwork (10 MB maximum). Textures are resized to 2048 pixels and support fit, fill, and stretch.
- Undo/redo edits; a complete drag is one history entry.
- Export/import validated versioned project JSON and export a clean PNG at normal or 2× resolution (capped at 4096 pixels).

The starting project is an editable example. Choose the project menu → New / import project to start with an empty booth.

## Controls

Click an object to select it and drag to move. Drag empty space to orbit, right-drag to pan, scroll to zoom. Use the object properties panel for exact sizes and positions. `V` selects the move tool; `M` toggles measurement. `Cmd/Ctrl+D` duplicates; `Cmd/Ctrl+Z` undoes; `Cmd/Ctrl+Shift+Z` redoes; Delete removes; Escape deselects. Shortcuts do not run while editing input fields.

## Storage and limits

Projects and embedded artwork live in IndexedDB in the current browser and origin. There is no authentication, server, or cloud sync. Export JSON for backups or to move between devices. Clearing site data removes local projects. Browser storage failures show a visible notice; JSON export remains available. Small UI preferences use localStorage.

A project supports up to 300 objects. Booth footprints support 1–20 m per side and heights of 1–10 m. Primitive geometry is intentionally simple. The editor targets desktops and larger tablets; phones show the scene with a desktop recommendation. The 3D viewport requires WebGL. Google Fonts are optional; system fonts are the fallback offline.

## Structure

- `src/domain`: serializable model, registry, unit conversions, geometry, schema validation
- `src/store`: immutable project edits and bounded history
- `src/persistence`: IndexedDB, file export, image processing
- `src/scene`: object renderer registry, camera, floor, selection, movement, measurement
- `src/components`: library, properties, accessible native dialogs
- `docs/architecture.md`: decisions and implementation plan

## Browser checks

With the development server running and Google Chrome installed:

```sh
node scripts/browser-check.mjs
node scripts/workflow-check.mjs
node scripts/drag-check.mjs
node scripts/visual-quality-check.mjs
node scripts/exhibition-check.mjs
node scripts/exhibition-preview.mjs
node scripts/exhibition-drag.mjs
```

The scripts use isolated browser contexts, verify the editor workflows, and save screenshots and downloaded examples in the OS temporary directory. They do not modify your normal browser projects.

The visual refinement architecture and validation notes are in `docs/visual-quality/implementation.md`.

Reference-based exhibition object specifications, asset sources and validation notes are in [docs/exhibition/implementation.md](docs/exhibition/implementation.md).
