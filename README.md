# 360Vision

360Vision is a single-owner local studio for authoring and viewing interactive
real-estate tours. It has no accounts, publication states, public gallery, or
cloud dependency. Each project is a portable JSON file in `data/tours/`.

## Main workflow

1. Open `/dashboard` and create a tour.
2. Add 2:1 equirectangular panoramas in `/studio/[tourId]`.
3. Add angular yaw/pitch hotspots and an optional multi-floor plan.
4. Wait for autosave, then preview the project at `/tour/[tourId]`.
5. Use Save as or Download JSON for a separate copy or backup.

## Stack

- Next.js 16, React 19, and strict TypeScript
- Three.js for authoring
- Photo Sphere Viewer for playback
- Sharp for image processing
- Zod for runtime validation
- Atomic local JSON storage and local uploaded assets

## Setup

Requires Node.js 22 or newer.

```text
npm install
npm run dev
```

Open `http://localhost:3000/dashboard`. No environment file is required.

## Commands

- `npm run dev` — run the local development server.
- `npm run lint` — run strict TypeScript validation.
- `npm run build` — create the production build.
- `npm start` — serve the production build locally.

Generated builds, traces, logs, caches, validation reports, and temporary
screenshots belong under `temp/`. Tour data and uploads remain under
`data/tours/` and `public/uploads/` because they are user-owned runtime data.

## Backup

Back up both `data/tours/` and `public/uploads/`. A tour JSON file references
its images by URL, so both locations are required for a complete restore.

The filesystem implementation is intentionally for one local machine. Do not
expose its unauthenticated write APIs on a public network.
