# Booth Studio implementation

The product brief is ../docs/build.md. This is a local-first V1, with no account or backend.

## Architecture and data

React 19 + TypeScript + Vite form the UI; React Three Fiber / Three.js render meters at 1:1 world scale. A typed object registry provides dimensions, limits, material, branding and renderer keys. A serializable Project contains version, identity, name, timestamps, booth dimensions, and objects. UI inputs convert centimeters at the boundary.

One Zustand store owns the project, selection and UI preferences. Immutable before/after snapshots implement bounded undo/redo; pointer movement is a transaction producing one entry. A separate IndexedDB adapter stores projects. Debounced writes are serialized and project IDs are captured to avoid cross-project races. Preferences alone use localStorage. Zod validates all JSON imports; a migration entrypoint rejects unknown schema versions.

## Interaction and components

The left library adds objects on click; scene dragging moves along a horizontal plane and suspends camera controls. The right properties panel offers exact dimensions, rotation, appearance, artwork, simple alignment and collapsed advanced coordinates. Empty space deselects. Locked objects cannot be edited. Top/front/side cameras are orthographic; perspective orbits. Measurement selects two floor points. The default example is editable; new projects start empty with inline onboarding.

`src/domain`: types, registry, calculations, schemas. `src/store`: edits/history. `src/persistence`: IndexedDB and uploads. `src/scene`: geometric renderers and viewport. `src/components`: library, properties, dialogs, toolbars. Business rules can be tested without WebGL.

## Decisions and critique

Use one store, not five coordinated stores. Primitive models are sufficient and keep the library offline. CSS tokens are simpler than a utility framework for this bounded editor. Native accessible controls avoid an unnecessary UI dependency. Snap uses configurable centimeter increments; positioning provides explicit center/edge alignment. Rotated bounds are calculated from the footprint. Allow out-of-bounds placements with warnings. Artwork is resized to at most 2048px, stored as a data URL and disposed as GPU textures on unmount. PNG export temporarily hides helper groups and uses a higher render resolution on demand.

Risks: orbit versus drag, lost pointer capture, typing keyboard shortcuts, texture failures, storage quota, oversized imports, mobile WebGL limits, rotated boundary calculations, and save ordering. Catch storage/render failures, validate limits and inputs, guard shortcuts, release drag state on pointer cancellation, and keep editing available after save errors.

## Phases and validation

1. Typed domain and application shell.
2. Real 3D scene and registry models.
3. Selection, drag transactions, properties, snapping, history.
4. Measurement, human scale, artwork, views.
5. Local project management, validated import/export, clean PNG.
6. Responsive refinement, domain tests, TypeScript, lint, production build and browser workflow checks.
