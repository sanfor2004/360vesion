# Technical Plan

## Architecture

- Next.js App Router provides the dashboard, Studio, Viewer, demo, and local APIs.
- `lib/types.ts` and `lib/schema.ts` define and validate the shared Tour shape.
- `lib/store.ts` validates reads and atomically writes one JSON file per tour.
- `lib/storage.ts` is the only upload persistence seam.
- Three.js and Photo Sphere Viewer stay client-only.

## Routes

- `/` redirects to `/dashboard`.
- `/dashboard` lists every local project.
- `/studio/[tourId]` authors and autosaves a project.
- `/tour/[tourId]` previews a saved project.
- `/demo` provides bundled sample content.
- `/api/tours` and `/api/tours/[id]` provide local CRUD.
- `/api/upload`, `/api/upload/icon`, and `/api/upload/floor-plan` process assets.

There are no community, profile, visibility, sharing, embed, sitemap, or
authentication subsystems.

## Data model

A Tour contains its id, title, description, start scene, scenes, optional floor
plan, and timestamps. A Scene contains an image, initial yaw/pitch/FOV, hotspots,
and an optional floor assignment. Legacy publication/profile fields are accepted
when reading older JSON but stripped from the runtime model and future saves.

## Storage and diagnostics

- Canonical projects: `data/tours/*.json`
- User uploads: `public/uploads/`
- Generated build/log/trace output: `temp/.next/`
- Compiler cache: `temp/cache/`
- Manual logs, reports, screenshots: corresponding `temp/` subdirectories

## Priorities

1. Complete package import/export including media.
2. Add destructive-action confirmation and broken-reference validation.
3. Add scene reordering and accessibility coverage.
4. Keep recovery feedback actionable and local.
