# Figma UI/UX Specification

This is the build brief for the editable 360Vision Figma file. It is intentionally implementation-aligned so future modules use the same decisions as the application.

## Pages and frames

1. **00 — Foundations**: logo, color variables, type scale, spacing, shadows, focus ring, icon style.
2. **01 — My work / desktop (1440px)**: local project library, empty state, new-tour action, tour card, status and scene counts.
3. **02 — Studio / desktop (1440px)**: three-column authoring shell; panorama canvas, scene list, inspector, floor-plan editor, save state, and View tour action.
4. **03 — Viewer / desktop (1440px)**: immersive panorama, left optional map, compact separate bottom scene rail, compass, location badge, previous/next and Auto tour controls.
5. **04 — Viewer / mobile (390px)**: collapsed top title, touch-safe actions, map above the scene rail, horizontal room cards.
6. **05 — States and prototype**: map enabled/disabled, first/second floor, no-plan fallback, active scene, hotspot panel, Auto tour playing/paused, and upload/error states.

## Required reusable components

- `Brand/Logo` — full and icon-only variants.
- `Viewer/Control` — default, hover, active, disabled, icon-only.
- `Viewer/SceneCard` — default and current-location variants.
- `Map/FloorTab`, `Map/Point`, `Map/CurrentLocation`.
- `Studio/SceneRow`, `Studio/InspectorSection`, `Studio/UploadDropzone`, `Studio/SaveStatus`.

## Prototype flows

1. My work → create local tour → Studio → upload panorama → add scene link → View tour.
2. Studio → enable floor plan → add a floor → upload plan → assign scene → click to add map point.
3. Viewer → map point / thumbnail / scene hotspot navigation → active floor and current marker update.
4. Viewer → Auto tour → slow 360° look → next connected room → stop.

## Design acceptance

- The Figma document uses variables named after the tokens in [BrandGuide.md](../BrandGuide.md), not one-off hex values.
- Build with auto layout and component instances; do not flatten repeated controls into one-off frames.
- Validate desktop and mobile frames for clipped room names, map labels, and controls.
- The Figma prototype describes behavior only; it must not imply authentication, cloud accounts, or multi-user collaboration.
