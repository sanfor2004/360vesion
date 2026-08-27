# 360Vision

360Vision is a Next.js application for creating, publishing, and viewing interactive 360 panorama tours. Creators can upload equirectangular panoramas, place hotspots in a browser-based studio, connect multiple scenes, and share public or unlisted tours from creator profiles.

The app has two main surfaces:

- Studio: a Three.js authoring experience for placing and editing hotspots by yaw and pitch.
- Viewer: a Photo Sphere Viewer runtime for public tour playback, scene navigation, gyroscope mode, stereo mode, and fullscreen viewing.

Hotspots are stored as angular coordinates instead of pixels, so tours keep working across image re-encoding and responsive image variants.

## Features

- Email/password authentication with optional Google OAuth through Auth.js.
- Creator dashboard, public creator profiles, and an explore feed for published tours.
- Draft, public, and unlisted tour visibility.
- Multi-scene tours with start scene, per-scene camera framing, and cover image selection.
- Hotspot types for information, links, scene transitions, and media panels.
- Panorama upload validation for 2:1 equirectangular images.
- Server-side image processing with Sharp for full, mobile, and thumbnail variants.
- Prisma-backed persistence for users, sessions, profiles, and tour JSON.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma with SQLite
- Auth.js / NextAuth v5
- Three.js
- Photo Sphere Viewer
- Sharp
- Zod

## Prerequisites

- Node.js 22 or newer
- npm
- SQLite, through Prisma

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill in the required values in `.env`, then generate the Prisma client and sync the database schema:

```bash
npm run db:generate
npm run db:push
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Configuration

All runtime configuration is documented in `.env.example`.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite connection string used by Prisma. Defaults to `file:./dev.db` in `.env.example`. |
| `AUTH_SECRET` | Yes | Auth.js secret. Generate one with `npx auth secret`. |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical public URL used for metadata, sitemap, robots.txt, and server-generated share URLs. |
| `AUTH_GOOGLE_ID` | No | Google OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth client secret. |

Local uploads are written to `public/uploads` and are ignored by git except for the `.gitkeep` placeholder. For production, use a persistent filesystem or replace `lib/storage.ts` with an object storage implementation that returns public image URLs.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the local Next.js development server. |
| `npm run build` | Build the production app. |
| `npm start` | Run the production build. |
| `npm run lint` | Run the configured lint command. |
| `npm run db:generate` | Generate the Prisma client. |
| `npm run db:push` | Push the Prisma schema to the configured database. |
| `npm run db:studio` | Open Prisma Studio. |

## Project Structure

```text
app/                 Next.js routes, pages, metadata, and API handlers
components/site/     Account, feed, profile, and dashboard UI
components/studio/   Three.js tour authoring studio
components/viewer/   Public panorama tour viewer
lib/                 Auth, storage, persistence, validation, and shared helpers
prisma/              Prisma schema
public/              Static assets and upload placeholders
scripts/             Utility scripts
data/tours/          Legacy/local data placeholder retained for compatibility
```

## Development Workflow

1. Create or sign in to an account.
2. Open the dashboard and create a tour.
3. Upload a 2:1 panorama image.
4. Add scenes and hotspots in the studio.
5. Save the tour and choose draft, public, or unlisted visibility.
6. View public tours through creator profiles, the explore feed, or direct tour URLs.

The repository includes `public/panoramas/test-grid.jpg` for local testing. Regenerate it with:

```bash
node scripts/make-test-panorama.mjs
```

## Deployment

This repository is deployment-neutral. It does not include provider metadata or assume a particular hosting platform.

For a production deployment, provide:

- A Node.js host that can run Next.js with the Node runtime.
- A writable SQLite database path reachable through `DATABASE_URL`, or a deliberate Prisma schema change to another database provider.
- A stable `AUTH_SECRET`.
- A configured `NEXT_PUBLIC_SITE_URL`.
- Persistent storage for uploaded images.

The default local storage implementation writes files into `public/uploads`. That is fine for local development and single-machine experiments, but it is not enough for hosts with ephemeral filesystems, multiple app instances, or read-only deployment directories.

## Security

Do not commit `.env`, `.env.*`, local uploads, generated build output, or provider-specific deployment metadata. Report vulnerabilities using the process in `SECURITY.md`.

## Contributing

Contributions are welcome. Please read `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and the issue and pull request templates before opening a change.

## License

This project is released under the MIT License. See `LICENSE` for details.
