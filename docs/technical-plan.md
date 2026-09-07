# Technical Plan

## Current stack

- Next.js 16 App Router and React 19.
- TypeScript with strict checking.
- Prisma 6 with a local SQLite database.
- Three.js for the authoring preview.
- Photo Sphere Viewer for runtime tour playback.
- Sharp for panorama, thumbnail, icon, and floor-plan processing.
- Zod for API payload validation.
- Tailwind CSS 4 and daisyUI 5 for semantic interface components.

## Architecture

### Application surfaces

- `app/(site)/dashboard` — local “My work” project library.
- `app/studio/[tourId]` — full-screen authoring application.
- `app/tour/[tourId]` — full viewer for stored tours.
- `app/embed/[tourId]` — reduced-chrome iframe viewer.
- `app/demo` — bundled demonstration tour.

### Data flow

1. The UI reads and writes a `Tour` through `/api/tours` endpoints.
2. Zod schemas validate incoming tour structures.
3. `lib/store.ts` stores scenes, hotspots, and floor-plan data as JSON in the Prisma `Tour.data` column.
4. Tour metadata remains in indexed SQLite columns.
5. Image endpoints process uploads and store them under `public/uploads` through `lib/storage.ts`.

### Local identity

The application uses one automatic SQLite owner row with ID `local-workspace-owner`. It is a relational anchor for tours, not an authentication identity. No passwords, sessions, cookies, OAuth accounts, or credential endpoints should exist.

### Shared UI foundation

- Inter is the global UI font, self-hosted through `@fontsource-variable/inter` and loaded once at the root layout.
- `components/ui/` contains the reusable `ActionButton`, `ActionLink`, `PageHeader`, `EmptyState`, and `StatusNotice` primitives.
- Reuse these components for ordinary site states instead of duplicating page-local button, header, empty-state, or alert markup. See `docs/ui-components.md` for the supported API and accessibility rules.

## Core data model

### Tour

- Metadata: title, description, visibility, timestamps, cover, view count.
- `startSceneId`.
- `scenes[]`.
- Optional `floorPlan`.

### Scene

- Panorama image and optional mobile/thumbnail variants.
- Initial yaw, pitch, and field of view.
- Hotspots.
- Optional `floorId`.

### Floor plan

- `enabled` controls viewer visibility.
- `floors[]` supports multi-storey properties.
- Each floor has a name, optional uploaded plan image, and points.
- Each point links one scene and stores responsive `x` and `y` percentages.

## Implementation phases

### Phase 1 — Local foundation

- Keep credential routes and packages removed.
- Initialize SQLite automatically from `.env`.
- Ensure local dashboard, create, edit, upload, and draft-view workflows are ungated.
- Add a friendly database-unavailable error rather than an authentication error.

### Phase 2 — Authoring quality

- Improve scene organization for larger properties.
- Add clear unsaved/error states and recovery guidance.
- Validate duplicate or missing map-to-scene links.
- Add confirmation for destructive scene/floor operations.
- Consider drag-to-reposition map points after click placement is stable.
- Keep the Studio inspector as a fixed-height shell with a fixed Edit/View toolbar and a single scrolling content region; section bodies should expand naturally inside that region.

### Phase 3 — Viewer quality

- Keep map, current location, floor tabs, compass, and room strip synchronized.
- Add keyboard focus states and screen-reader labels.
- Tune overlays across phone, tablet, laptop, and wide-screen layouts.
- Optimize thumbnail and panorama loading behavior.
- Provide previous/next room controls and an Auto tour state. Auto tour should animate the current panorama when supported, then choose a connected scene hotspot; if no connection exists, it advances through the ordered scene list. Visitor input stops the tour in a future enhancement.

### Phase 4 — Portability and delivery

- Add explicit export/import for a complete tour package.
- Document backup of the SQLite database and uploaded media.
- Make hosted deployment optional and clearly separate from the local workflow.
- If hosted, replace local uploads and SQLite only when persistent infrastructure is available.

## Technical risks and mitigations

- Large panorama memory use: enforce resolution limits and use mobile variants.
- SQLite or upload loss: document backup/export and keep files within known project paths.
- Broken scene links after deletion: clear or validate references during mutations.
- Missing floor plans: preserve full room-strip and hotspot navigation when maps are disabled.
- Layout obstruction: cap map and thumbnail-strip dimensions and test small screens.
- Schema drift: update `lib/types.ts`, `lib/schema.ts`, and persistence together.

## Decisions pending future references

- Hosting target and persistent storage requirements.
- Required property metadata and agent/contact presentation.
- Import/export package format.
- Hosting target and persistent storage requirements.
