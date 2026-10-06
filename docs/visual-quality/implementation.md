# Visual quality pass

Scope: `../../../Prompt/Visual-Quality-Pass.md` (the supplied refinement brief). The editor shell, panel widths, camera composition, fonts, spacing, navigation, and interaction model are preserved.

## Audit

The serializable registry, immutable history, IndexedDB adapter, validated JSON files, floor-locked drag, and artwork upload processing already worked. The previous renderer scaled normalized primitives and applied a material to every child with an imperative traversal. That overwrote differentiated finishes. The floor color was fixed, the grid was only a UI preference, and sharp boxes made most furniture look like placeholders.

## Implementation

1. Add a domain-only material/texture registry and additive version-1 floor defaults for old files.
2. Store floor color, material and grid together inside the project; route inspector and toolbar through the same undoable action.
3. Replace the blanket material traversal with declarative per-part finishes. Use dimension-aware procedural parts, subtle bevels, thin manufactured furniture elements, and a few serializable variants.
4. Generate four small 512px material textures locally, with UV coordinates in physical meters. Share textures, material instances, and repeated part geometry through reference-counted pools. Dispose resources after the final owner leaves, with a small delay for StrictMode replay.
5. Preserve separate uploaded branding textures. Share identical artwork surfaces; use sRGB for color maps, renderer output conversion, and untinted artwork. Screen/metal changes do not recolor uploaded content.
6. Add restrained fill and a one-time 64px studio environment for readable metal highlights, and tighten the single 2048px shadow map around the booth. Use soft VSM shadows without screen-space postprocessing. Consolidate the floor grid into a single draw call.
7. Add compact floor controls, existing-style color swatches, a material selector, and bounded furniture style choices. Native color input previews use one labeled history transaction per editing session.
8. Verify old-file migration, exact dimensions, appearance history, imports/exports, persisted visual state, existing workflows, and resource counts on a 40-object scene.

## Defaults and extension points

Old version-1 files gain the warm matte floor and enabled grid. Their existing furniture dimensions, finishes, artwork and transforms are retained. New tables and shelves use natural oak, new chairs use fabric, and the sample sage/sand palette remains.

The object definition now has an explicit procedural/model render descriptor. All shipped objects remain editable procedural models. A model loader can be added at that renderer boundary later; no external GLB, model dependency, or unlicensed asset was introduced for this pass.

Shapes: counter solid/open; table round/square/rectangle; chair simple/modern; stand pedestal/shelf. Rectangle starts at a 1.5:1 footprint if the current table is square. Exact dimensions remain editable.

## Performance scope

Rendering remains on demand. Geometry uses two bevel segments only on furniture parts, 32–40 radial segments on turned parts, and very low-poly foliage. Material maps are shared 512px canvases; the studio environment renders once. Resource tests exercise repeated material switching after a 40-object scene is mounted. Headless checks use SwiftShader, so their timing is not a hardware-GPU 60 FPS certification. Test the 60 FPS target on the user's target GPU before making that claim.

## Validation results

- TypeScript/production build and ESLint passed.
- 24 unit tests passed, including old v1 imports, floor serialization, material validation, variants, physical texture scale, history and grid contrast.
- Browser checks passed for four floor presets, custom colors, one history entry per color session, grid synchronization, reload persistence, and JSON round-trip.
- The 40-object scene reported 188 draw calls, 51,898 triangles, 8 textures and 52 geometries. After three full metal/default material cycles and resource cleanup, counts remained exactly the same.
- Visually inspected the default scene, dark carpet with the visible grid, and all ten refined furniture types. Images are recorded next to this report.
- The existing 15 browser workflow checks and seven drag/locking/project checks also passed, including artwork, dimension edits, measurements, mouse dragging, old keyboard shortcuts, PNG/JSON export, and mobile preview.
- The final production build opened without browser errors. Verified that Modern chair style remains selected after a material change and exported a clean 2× PNG.
