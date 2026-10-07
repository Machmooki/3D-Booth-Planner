# Reference-based exhibition objects

Extends the existing registry, renderer map, thumbnail component and property panel. The approved workspace and existing editor operations remain in place.

| Object | Default W × H × D (cm) | Details / editable options |
| --- | --- | --- |
| Bangchak Sign | 260 × 130 × 55 | Raised curved leaf shoulder, thick sign body, layered rounded plinth, built-in logo and tagline; optional replacement artwork |
| Oil Display Stand | 280 × 125 × 65 | Curved podium, layered plinth, five circular sample vessels with metal caps and risers, editable UCO / TREATED UCO / SAF / B24 / HVO labels; With products / Podium only |
| Roll-up Banner | 85 × 200 × 32 | Portrait sheet, slim top rail, rear pole, weighted cassette, end caps and stabilizing feet; 85 / 100 / 120 × 200 cm presets and replacement artwork |

Dimensions describe the complete physical envelope, including feet and sample vessels. The oil podium's height retains its full display envelope when products are hidden, keeping layouts stable between variants. Roll-up limits preserve a portrait shape. Preset dimensions include the cassette/top rail; the printable sheet is slightly inset.

## Reference decisions

The two supplied photographs are the primary references for the sign and podium. The sign uses the raised leaf shoulder, green wordmark, lower-right “group” and two-line mobility tagline. The podium uses transparent sample chambers, dark and pale sample fills, circular silver bases and front labels. The small information cards have been removed per the follow-up reference. Five editable oil names appear on the podium front; a blank name hides its label.

No third photo was attached. The roll-up follows the standard exhibition construction described in `Prompt/Add-Furniture.md`. Its placeholder design follows Booth Studio's existing palette and can be replaced with PNG/JPEG/WebP artwork.

The Bangchak leaf and wordmark are bundled from the [official logo download page](https://www.bangchak.co.th/en/download-center/bangchak-logo), specifically [Color-Logo-Horizontal.png](https://www.bangchak.co.th/storage/document/logo/Color-Logo-Horizontal.png). The asset is kept locally at `public/artwork/bangchak-logo.png`, so the running editor does not contact Bangchak. “group” and the tagline are typeset separately to match the reference composition. This is a procedural visual reconstruction, not a manufacturing model or an exact replica of the original font/sculpted lettering.

## Implementation

- `src/domain/model.ts`: additive object types, sensible physical limits, variants and reusable size-preset metadata. Schema version 1 remains compatible with existing projects. The previous simple `banner` stays available as **Banner panel**, avoiding confusion with the new detailed **Roll-up Banner**; saved object identities and names are preserved.
- `src/scene/exhibitionGeometry.ts`: extruded rounded footprints with curvature independent of plinth thickness, plus the raised sign silhouette. UVs use physical dimensions.
- `src/scene/ExhibitionModels.tsx`: three reusable renderers, built-in graphics and reference-based composed parts. Sample vessels use a local square coordinate system so they remain circular as the podium changes width.
- `src/scene/Artwork.tsx`: extracted existing artwork handling, shared by original and new objects. Fit/fill/stretch, embedded image serialization and undo remain unchanged.
- `src/scene/materials.ts`: existing reference-counted geometry/material/texture strategy reused. Default artwork is generated once per graphic kind; no Three.js resources enter Zustand or JSON.
- `src/components/ObjectThumbnail.tsx`: three small dimensional SVG drawings in the existing library style.
- `src/components/Properties.tsx`: optional registry-driven size presets. Existing dimensions, appearance, variants and upload controls handle the remaining properties.

## Validation

Run with the development server at `http://127.0.0.1:5173` and Google Chrome installed:

```sh
npm test
npm run lint
npm run build
node scripts/exhibition-check.mjs
node scripts/exhibition-preview.mjs
node scripts/exhibition-drag.mjs
node scripts/workflow-check.mjs
node scripts/drag-check.mjs
```

The exhibition browser check exercises library insertion, edit history, duplication/deletion, preset selection, artwork overrides, product visibility, refresh persistence, real JSON download/import, actual rendered bounds at minimum and maximum dimensions, and repeated duplicate/delete resource cycles. Browser contexts are isolated from normal user projects. Preview screenshots are generated in `/tmp/booth-exhibition`.

Visual review covers the three objects individually and together; the rear support, layered bases and rounded side surfaces are procedural 3D geometry. Performance measurements use headless Chrome's SwiftShader renderer, not a hardware frame-rate benchmark.

### Results

- 33 unit tests pass; TypeScript production build and ESLint pass.
- Exhibition browser acceptance passes with no page errors, including actual mesh bounds at minimum/maximum sizes and stable resources after three duplicate/delete cycles.
- All three objects pass real pointer selection and dragging, floor anchoring, grid snapping and one-step undo.
- Existing editor regression checks pass: 15 workflow checks (including PNG export and mobile overflow) and 7 drag/project checks.
- Fifteen custom objects use eight textures; after deleting duplicates, geometry and texture counts return to the three-object baseline. This checks resource reuse rather than promising a frame rate on every device.

Screenshots: [collection](collection.png), [Bangchak Sign](bangchak-sign.png), [Oil Display Stand](oil-display.png), [Roll-up Banner](rollup-banner.png).

## Reference refinement

The follow-up removes all product information cards while keeping the five sample vessels. **Oil names** in the inspector edits the five front labels, supports Unicode and blank labels, and commits each field on blur/Enter as one undo step. `oilLabels` is optional, so existing JSON projects retain the original five names. Custom names survive duplication, autosave and JSON export/import; Reset restores the defaults.

The Bangchak sign was subsequently restored to its original smooth-shoulder body, original depth, layered plinth and original logo composition at the user's request. The “group” baseline is raised from 615 to 550 canvas pixels to sit closer below “bangchak”. Oil-name configuration and removal of information cards remain in place.
