# Validation Plan

## Automated checks

Run from the project root:

```text
npm run lint
npm run build
```

When the Prisma schema changes:

```text
npm run db:generate
npm run db:push
```

Expected results:

- TypeScript exits without errors.
- The production build completes.
- Prisma validates and synchronizes the SQLite schema.
- Removed authentication routes do not appear in the build route list.

## Local access checks

- `/dashboard` returns successfully without a session cookie.
- `/studio/[tourId]` opens directly.
- `/tour/[tourId]` displays local drafts.
- `/login` and `/signup` remain absent.
- Panorama, icon, and floor-plan uploads work without credentials.
- Creating a tour assigns it to the automatic local owner.

## Studio functional checks

- Create a tour from My work and confirm immediate studio navigation.
- Edit title, description, and visibility; wait for the Saved state; reload.
- Upload a valid 2:1 panorama and verify full, mobile, and thumbnail variants.
- Reject a non-2:1 panorama with an understandable error.
- Add, rename, switch, and remove scenes.
- Set and preview the starting view.
- Add each hotspot type and verify its editor fields.
- Navigate a scene hotspot in View mode.
- Enable the property map and upload a non-2:1 plan image.
- Add two floors, rename them, and switch between them.
- Assign different scenes to different floors.
- Click a plan to place a scene, click again to move it, and remove its point.
- Reload and confirm floor images, assignments, and points persist.
- Expand several Studio inspector sections together and confirm the right panel has one usable scrollbar, the Edit/View toolbar remains visible, and hotspot/map editors do not create nested scrollbars.

## Viewer functional checks

- Start scene and initial view load correctly.
- Panorama drag, zoom, fullscreen, gyroscope, and stereo controls behave where supported.
- Scene hotspots, map points, and thumbnails all navigate correctly.
- Current room label and map marker update after each navigation method.
- Selecting a scene on another floor switches the active floor.
- Hide/show map works without affecting the room strip.
- Tours with the map disabled remain fully navigable.
- Tours with no floor-plan image show a sensible fallback.
- Information and media panels open and close correctly.
- Previous and next room controls select the expected scene.
- Start Auto tour, confirm its playing state is obvious, wait for a scene change, and stop it. Confirm the stop control works immediately.

## Visual checks

Inspect at minimum:

- Mobile portrait: 390 × 844.
- Tablet portrait: 768 × 1024.
- Laptop: 1366 × 768.
- Desktop: 1920 × 1080.

Verify:

- The map stays on the left and does not cover essential controls.
- The room strip is separate from the map and remains compact.
- Floor tabs and room names do not overflow.
- Current-location markers remain visible over light and dark plans.
- Focus indicators, contrast, and minimum control sizes are usable.
- No unintended page scrolling occurs in full-screen studio/viewer routes.
- Auto-tour controls remain readable and usable over bright and dark panoramas.

## Persistence and recovery checks

- Restart the development server and confirm tours remain in SQLite.
- Verify uploaded images still resolve after restart.
- Copy `prisma/dev.db` and `public/uploads` as a backup; restore into a clean checkout and verify content.
- Export a tour JSON and confirm it contains scenes, hotspots, and floor-plan data.

## Release evidence

Record for each delivery:

- Commit or build identifier.
- Automated-check output.
- Browser/viewports tested.
- Tour used for functional testing.
- Screenshots of My work, Studio, desktop Viewer, and mobile Viewer.
- Known limitations and deferred issues.
