# Validation Plan

## Required checks

```text
npm run lint
npm run build
```

The build route list must contain the dashboard, Studio, Viewer, demo, and local
APIs. It must not contain login, profile, Explore, embed, sitemap, or publication
routes.

## Local workflow

- `/` redirects to `/dashboard` without credentials.
- Create, rename, edit, copy, delete, and reopen a project.
- Confirm autosave persists title, description, scenes, hotspots, and floor plans.
- Confirm older JSON with legacy fields loads and a subsequent save removes them.
- Upload valid panoramas, icons, and floor plans; reject invalid panoramas clearly.
- Download readable JSON.

## Studio and Viewer

- Exercise scene and hotspot authoring, start framing, map floors, and map points.
- Verify hotspot, room-strip, map, previous/next, and Auto tour navigation.
- Verify active room and floor remain synchronized.
- Check 390×844, 768×1024, 1366×768, and 1920×1080.
- Confirm Studio has one inspector scrollbar and a fixed two-row toolbar.
- Confirm WebGL failure leaves project controls usable.

## Persistence

- Restart and reopen projects.
- Back up and restore `data/tours/` with `public/uploads/`.
- Keep generated diagnostics under `temp/`, never in the project root.
