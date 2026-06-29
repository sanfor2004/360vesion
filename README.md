# 360Vision

A **community platform for 360° content** — the first 360° online studio. Creators
sign up, build interactive panorama tours in the browser, publish them
(draft / public / unlisted), and share them via public profiles and a global
Explore feed. Think ArtStation, for immersive 360°.

Under the hood it's an interactive **360° panorama tour** engine with a two-part
architecture sharing one JSON data format:

- **Studio** (authoring) — a custom **Three.js** editor: the camera sits at the
  centre of an inverted sphere textured with an equirectangular image. Click to
  raycast against the sphere, convert the hit to `{yaw, pitch}`, and place a
  hotspot. Manage multiple scenes, edit hotspots, upload images, save to the
  backend.
- **Viewer** (runtime, public) — built on **[Photo Sphere Viewer](https://photo-sphere-viewer.js.org/)**
  via its official React wrapper. Loads a tour's JSON, renders hotspots as
  markers, navigates between scenes, opens info/media panels and external links,
  and offers gyroscope + VR (cardboard) modes.

Author once, store the data, render it anywhere. Hotspots are stored by **angle
(yaw/pitch in degrees), never pixels**, so they survive image re-encoding and
resolution changes.

Built on **Next.js 16 (App Router) + TypeScript**. The data model is defined once
in [`lib/types.ts`](lib/types.ts) and used by both halves.

---

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Pages](#pages)
- [API](#api)
- [Image rules](#image-rules)
- [Storage, persistence & auth (the seams)](#storage-persistence--auth-the-seams)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Dependency notes & version lock](#dependency-notes--version-lock)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Status](#status)
- [Product vision & positioning](#product-vision--positioning)
- [Roadmap & future features](#roadmap--future-features)

---

## Features

**Studio (authoring)**
- Inverted-sphere Three.js viewer with drag-to-look, wheel/pinch zoom.
- Click-to-place hotspots; live yaw/pitch HUD and crosshair while placing.
- Edit panel: label, type (`info` / `link` / `scene` / `media`), content,
  conditional URL, target-scene dropdown, custom pin icon, precise yaw/pitch.
- Hotspot list with select/delete; Edit/View mode toggle with click-to-open
  popups.
- **Multi-scene** management: add / rename / delete scenes, pick the start
  scene, per-scene initial camera framing (yaw/pitch/fov).
- Image upload (validated + variant-generated) with instant local preview.
- Save/load to the backend; export the whole tour to a JSON file.

**Viewer (runtime)**
- Renders hotspots as PSV markers: a colored dot, a built-in teardrop pin, or a
  custom image you upload per hotspot.
- `select-marker` routing: `info`/`media` → panel (with embedded image for media
  URLs), `link` → opens URL, `scene` → navigates to another panorama.
- Multi-scene navigation via `setPanorama` + `setMarkers`, with a current-scene
  label.
- Navbar with zoom, move, **gyroscope** (device orientation) and **stereo** (VR
  cardboard) buttons, plus fullscreen.
- Loads the smaller mobile image variant on phones.

**Backend**
- Plain CRUD over tours (JSON files) + an image upload/processing endpoint.
- zod-validated request bodies; auth gate on all write endpoints.
- Tours gallery with thumbnails and a create-new-tour flow.

---

## Quick start

```bash
npm install
cp .env.example .env                 # set DATABASE_URL + AUTH_SECRET (npx auth secret)
npm run db:push                      # sync the schema to your MySQL database
npm run dev                          # http://localhost:3000
```

**Database:** **MySQL**, via **Prisma**. Put your connection string in
`DATABASE_URL` (URL-encode special characters in the password) and run
`npm run db:push` to sync the schema. The host is shared MySQL, which doesn't
allow the shadow database `prisma migrate dev` needs, so we sync the schema
directly with `db push` rather than keeping a migration history.

**Accounts:** email/password + optional Google OAuth via **Auth.js (NextAuth v5)**.
Sign up at `/signup`, then your tours live under `/dashboard`.

| Script | Does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build + typecheck |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |

A local test panorama (`public/panoramas/test-grid.jpg`) ships in the repo so the
studio and viewer work offline. Regenerate it with:

```bash
node scripts/make-test-panorama.mjs
```

**First run:** open [`/tours`](http://localhost:3000/tours), type an id (e.g.
`my-apartment`), click **Open studio**, place hotspots, and **Save**. Then visit
`/tour/my-apartment` to see the viewer.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Studio rendering | Three.js `0.184.0` |
| Viewer rendering | Photo Sphere Viewer `5.14.3` (core + markers, gyroscope, stereo, virtual-tour) via `react-photo-sphere-viewer` `6.x` |
| Image processing | sharp |
| Validation | zod |
| IDs | uuid + Prisma `cuid` |
| Styling | Plain CSS + CSS Modules (no framework) |
| Database / ORM | **Prisma** + **MySQL** (`npm run db:push` to sync) |
| Auth | **Auth.js / NextAuth v5** — email/password (bcryptjs) + Google OAuth |
| Persistence | Prisma `Tour` model (`data` Json + queryable columns) |
| Image storage | Local `public/uploads` (swappable) |

---

## Architecture

```
              ┌─────────────────────────────────────────────┐
              │                    STUDIO                     │
  panorama →  │  Three.js inverted sphere + raycast editor    │ → Tour JSON
  (upload)    │  (components/studio/SphereStudio.tsx)         │
              └─────────────────────────────────────────────┘
                                   │  PUT /api/tours/:id
                                   ▼
              ┌─────────────────────────────────────────────┐
              │                BACKEND / STORAGE              │
              │  tours → data/tours/*.json   (lib/store.ts)   │
              │  images → public/uploads/*   (lib/storage.ts) │
              │  auth gate (lib/auth.ts) · zod (lib/schema.ts)│
              └─────────────────────────────────────────────┘
                                   │  GET /api/tours/:id (public)
                                   ▼
              ┌─────────────────────────────────────────────┐
              │                    VIEWER                     │
  end user ←  │  Photo Sphere Viewer + markers / VR plugins   │
              │  (components/viewer/TourViewerInner.tsx)      │
              └─────────────────────────────────────────────┘
```

Both halves depend only on the shared types in `lib/types.ts`. The studio writes
that shape; the viewer reads it.

---

## Data model

Defined in [`lib/types.ts`](lib/types.ts); validated by zod schemas in
[`lib/schema.ts`](lib/schema.ts).

```ts
interface Tour {
  id: string;
  title: string;
  startSceneId: string;       // which scene loads first
  scenes: Scene[];
  createdAt: string;          // ISO date
  updatedAt: string;          // ISO date
}

interface Scene {
  id: string;
  name: string;               // e.g. "Living Room"
  image: ImageAsset;
  initialYaw: number;         // entry camera framing (deg)
  initialPitch: number;
  initialFov: number;         // ~75 default
  hotspots: Hotspot[];
}

interface Hotspot {
  id: string;
  type: "info" | "link" | "scene" | "media";
  label: string;              // marker tooltip
  content: string;            // panel body (info/media)
  yaw: number;                // horizontal angle (deg)
  pitch: number;              // vertical angle (deg), clamp ±89
  targetSceneId?: string;     // type === "scene"
  url?: string;               // type === "link" | "media"
  icon?: string;              // built-in pin name OR uploaded icon URL (else a dot)
}

interface ImageAsset {
  url: string;                // full-res equirectangular
  width: number;              // should be 2:1
  height: number;
  projection: "equirectangular" | "cubemap";
  mobileUrl?: string;         // downscaled variant
  thumbnailUrl?: string;      // for the gallery
}
```

### Example tour JSON

```json
{
  "id": "demo",
  "title": "Two-Room Demo",
  "startSceneId": "room_a",
  "scenes": [
    {
      "id": "room_a",
      "name": "Room A",
      "image": { "url": "/panoramas/test-grid.jpg", "width": 4096, "height": 2048, "projection": "equirectangular" },
      "initialYaw": 0, "initialPitch": 0, "initialFov": 75,
      "hotspots": [
        { "id": "a_info", "type": "info",  "label": "Room A", "content": "North = yaw 0.", "yaw": 0, "pitch": 0 },
        { "id": "a_to_b", "type": "scene", "label": "Go to Room B", "content": "", "yaw": 90, "pitch": 0, "targetSceneId": "room_b" }
      ]
    }
  ],
  "createdAt": "2026-06-27T00:00:00.000Z",
  "updatedAt": "2026-06-27T00:00:00.000Z"
}
```

---

## Pages

| Route | Auth | What |
|---|---|---|
| `/` | public | Landing + recently-published feed |
| `/explore` | public | Global feed of public tours |
| `/u/[username]` | public | Creator profile + their public tours (portfolio) |
| `/login`, `/signup` | public | Email/password + Google sign-in |
| `/dashboard` | **signed-in** | Your tours (drafts + published); create / edit / delete |
| `/settings/profile` | **signed-in** | Edit username, name, bio, website |
| `/studio/[tourId]` | **owner only** | Authoring studio — gated server-side by ownership |
| `/tour/[tourId]` | visibility-gated | Viewer — public/unlisted for all; drafts only to the owner |
| `/tours` | — | Redirects to `/explore` |

---

## API

All under `/api`. Bodies validated with zod; write routes go through the auth
gate.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/upload` | ✓ | Validate a 2:1 panorama, generate mobile + thumbnail, store, return `UploadResult` |
| `POST` | `/api/upload/icon` | ✓ | Store a custom hotspot pin image (no 2:1 rule; fitted onto an 80×80 transparent PNG), return `{url}` |
| `GET` | `/api/tours` | public | List tours (gallery) |
| `POST` | `/api/tours` | ✓ | Create a tour |
| `GET` | `/api/tours/:id` | public | Full tour JSON (used by the viewer) |
| `PUT` | `/api/tours/:id` | ✓ | Upsert scenes + hotspots (from the studio) |
| `DELETE` | `/api/tours/:id` | ✓ | Remove a tour |

**Auth:** write routes require a signed-in user (Auth.js session cookie); tour
mutations additionally require **ownership** (returns `403` otherwise). `GET
/api/tours/:id` is public but hides drafts from non-owners. Profile updates live at
`PUT /api/profile`; auth itself at `/api/auth/*`.

**Upload** rejects non-2:1 images and images wider than 8192px with `422`.

---

## Image rules

Enforced on upload (`app/api/upload/route.ts`):

- **Equirectangular, exactly 2:1** aspect ratio (±1% tolerance) — else rejected.
- **≤ 8192 px wide** (GPU texture cap) — else rejected.
- Re-encoded to JPEG (strips GPano/EXIF metadata).
- Generates a **2048-wide mobile variant** and a **400-wide thumbnail**.
- Recommended source size: **4096 × 2048**.

When you move images off-origin, serve them with **CORS headers** and the viewer
will load them with `crossOrigin="anonymous"` (already set on the loaders).

---

## Storage, persistence & auth (the seams)

Three modules are deliberate swap points. Replace the body, keep the signature —
callers don't change.

| Seam | File | Today | Swap to |
|---|---|---|---|
| Tour persistence | [`lib/store.ts`](lib/store.ts) | **Prisma** (`Tour` model; MySQL) | Postgres — change the datasource only |
| Image storage | [`lib/storage.ts`](lib/storage.ts) | `public/uploads/`, served at `/uploads/<key>` | S3 / Vercel Blob / a CDN (set CORS) |
| Auth | [`lib/auth.ts`](lib/auth.ts) | **Auth.js (NextAuth v5)** — email/pw + Google | add more OAuth providers / org SSO |

`public/uploads/` is git-ignored runtime data (not source).

---

## Environment variables

Copy [`.env.example`](.env.example) → `.env.local`. All optional for local dev.

| Var | Purpose |
|---|---|
| `DATABASE_URL` | **Required.** Prisma MySQL connection string: `mysql://user:pass@host:3306/db?connection_limit=5` (URL-encode special chars in the password). |
| `AUTH_SECRET` | **Required.** Auth.js session/JWT secret. Generate with `npx auth secret`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google OAuth. Redirect URI: `<origin>/api/auth/callback/google`. Leave blank to disable the Google button. |

> Self-hosted Auth.js needs `trustHost: true` (already set in `lib/auth.ts`) so it
> accepts your deployment host outside Vercel.

---

## Project structure

```
app/
  layout.tsx                       # root layout + viewport/theme
  page.tsx                         # landing
  globals.css                      # base theme variables
  tours/
    page.tsx                       # gallery (server component)
    NewTourForm.tsx                # create-new-tour (client)
    tours.module.css
  studio/[tourId]/page.tsx         # studio route
  tour/[tourId]/page.tsx           # viewer route (loads tour server-side)
  api/
    upload/route.ts                # POST image → validate/resize/store
    tours/route.ts                 # GET list · POST create
    tours/[id]/route.ts            # GET · PUT · DELETE

components/
  studio/
    SphereStudio.tsx               # Three.js authoring tool (client)
    SphereStudio.module.css
    raycast.ts                     # yaw/pitch ↔ world helpers
  viewer/
    TourViewer.tsx                 # thin client boundary (dynamic, ssr:false)
    TourViewerInner.tsx            # PSV viewer + plugins + navigation
    TourViewer.module.css
    hotspot-handlers.ts            # hotspot → marker, select → action

lib/
  types.ts                         # the shared data model (source of truth)
  schema.ts                        # zod schemas mirroring types.ts
  store.ts                         # tour persistence seam (JSON files)
  storage.ts                       # image storage seam (local disk)
  auth.ts                          # auth seam (shared secret)
  api-client.ts                    # typed fetch wrappers for the studio

public/
  panoramas/test-grid.jpg          # offline test panorama
  pins/{info,link,scene,media}.svg # custom marker icons
  uploads/                         # uploaded images (runtime, git-ignored)

data/tours/                        # saved tours (runtime, git-ignored)
scripts/make-test-panorama.mjs     # regenerate the test grid
Sphere studio.html                 # original standalone prototype (reference)
```

---

## How it works

**Placing a hotspot (studio):** a pointer click is raycast against the inverted
sphere; the hit point is converted to `{yaw, pitch}` (see
`components/studio/raycast.ts`). Markers are React-rendered DOM elements
re-projected to screen space every animation frame for performance (no React
re-render per frame). The HUD writes yaw/pitch directly to the DOM.

**Per-scene framing:** switching scenes snapshots the live camera into the
outgoing scene's `initialYaw/Pitch/Fov` and restores the incoming one, so each
scene remembers where it was last framed; Save captures the active scene's
current camera too.

**Rendering (viewer):** the tour page reads the store on the server (GET is
public) and passes the whole `Tour` to a client-only viewer (dynamic import,
`ssr:false`, because PSV touches `window`). Hotspots become markers; the
`select-marker` handler reads the *current* scene's hotspots via a ref so
navigation stays correct after scene switches.

**Scene navigation:** selecting a `scene` hotspot calls PSV `setPanorama(target)`
then `markersPlugin.setMarkers(...)` — the "manual swap" approach (full control,
no extra plugin needed).

---

## Dependency notes & version lock

- **`three` is pinned to `^0.184.0`** to match Photo Sphere Viewer's peer range
  (`@photo-sphere-viewer/core@5.14.3` depends on `three@^0.184.0`). A mismatch
  makes the viewer render a **blank screen**. The studio (Three.js) and viewer
  (PSV) share this single `three` version.
- All PSV plugins (`markers`, `gyroscope`, `stereo`, `virtual-tour`) are pinned
  to the same **5.14.3** as core.
- `react-photo-sphere-viewer@6` peer-depends on PSV core `>=5.13.1`.

Added dependencies and why: `react-photo-sphere-viewer` (official React wrapper),
`uuid` (stable ids), `sharp` (image validation + variants), `zod` (request
validation). Nothing else beyond the framework + PSV/three.

> npm may report a transitive `postcss` advisory via Next and a `sharp`
> install-script warning. Both are benign here — do **not** run
> `npm audit fix --force` (it would downgrade Next), and sharp ships its native
> binary as an optional dependency so the gated install script isn't needed.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Viewer is blank | `three` version drifted from PSV's range — keep `three@^0.184.0`. |
| `NetworkError` loading a panorama | The image URL is unreachable or lacks CORS. Use a same-origin or CORS-enabled URL. |
| Upload returns `422` | Image isn't exactly 2:1, or is wider than 8192px. |
| Write endpoint returns `401` / `403` | Not signed in (`401`), or signed in but not the tour's owner (`403`). Log in at `/login`; check `AUTH_SECRET` is set. |
| Tour page says "not found" | No tour saved under that id yet — create it in the studio. |
| Poles look stretched | The source image isn't true equirectangular 2:1. |

---

## Deployment

Before deploying:

1. **Set `AUTH_SECRET`** (`npx auth secret`) and configure your OAuth providers —
   write endpoints are already gated by Auth.js sessions + per-tour ownership.
2. **Swap `lib/storage.ts`** to durable object storage (S3 / Blob / CDN) with
   CORS headers — local `public/uploads` is not persistent on most hosts.
3. **Swap `lib/store.ts`** to a database — local JSON files aren't persistent on
   serverless/edge hosts.
4. Serve panoramas from your own domain/CDN; keep them ≤ 8192px and 2:1.

The app is a standard Next.js App Router project (`npm run build` / `npm start`).
Routes that use sharp / fs run on the Node.js runtime.

---

## Status

**The tour engine is complete** (studio + viewer + JSON model):

- [x] Typed data model shared by both halves + single-panorama viewer
- [x] Studio: click-to-place hotspots, edit panel, multi-scene, export JSON
- [x] Persistence: `/api/upload` + `/api/tours` CRUD
- [x] Viewer: markers → panels / links / scene navigation
- [x] Polish: VR/gyroscope buttons, gallery + thumbnails, mobile image variants,
  custom pin icons

**Community platform — Milestone 1 (done):** the "ArtStation for 360°" pivot.

- [x] **Auth.js (NextAuth v5)** — email/password + Google OAuth
- [x] **Prisma** data layer on **MySQL**
- [x] Public **creator profiles** (`/u/[username]`), **dashboard**, **Explore** feed
- [x] Per-tour **visibility** (draft / public / unlisted) + ownership gating

**Known limitations**
- Persistence and image storage are local-disk by default; swap the
  [seams](#storage-persistence--auth-the-seams) (`lib/store.ts`, `lib/storage.ts`)
  for a real deploy.
- `cubemap` projection is reserved in the type but not implemented (equirect only).
- No social graph yet (no likes / follows / comments) — see the roadmap below.

---

## Product vision & positioning

360Vision aims to be the **community home for 360° creators** — the missing middle
between two existing camps:

| Camp | Examples | Strength | Gap we exploit |
|---|---|---|---|
| Pro tour builders | Kuula, Panoee, GoThru, 3DVista | Deep editor + paid tiers | Weak community / portfolio identity |
| Social 360 feeds | Panorra, Momento360 | Frictionless share + feed | Shallow authoring, no pro tooling |

**Our wedge:** a capable in-browser studio **plus** a creator community and
portfolio — author a real interactive tour, publish it to a profile, and have it
discovered and embedded everywhere. Two compounding loops drive growth:

1. **Distribution loop** — every embedded tour carries a "Made with 360Vision"
   link back. (Kuula and Momento360 both lead with embed-anywhere / view-without-signup.)
2. **Social loop** — follows, likes and a real feed turn one-off uploads into
   return visits. (This is exactly what Panorra wins on.)

---

## Roadmap & future features

Prioritized by impact on those two loops. Checkboxes track build status.

### Milestone 2 — Distribution loop (next)

The cheapest growth engine; build before social.

- [ ] **`/embed/[tourId]` route** — iframe-friendly, minimal-chrome viewer.
- [ ] **Share dialog** — copy link, copy `<iframe>` snippet, social preview.
- [ ] **SEO / Open Graph** — per-tour OG/Twitter meta + auto cover image,
  `sitemap.xml`, `robots.txt`. Public tours should be Google-findable.
- [ ] **"Made with 360Vision" badge** on free embeds (reuse the studio logo
  component) — links back to the tour/site.
- [ ] **Tags / categories** on tours + filterable Explore (real estate, travel,
  events, art…).

### Milestone 3 — Social loop

Turn Explore into a living community.

- [ ] **Likes** + **follows** (new Prisma models: `Like`, `Follow`).
- [ ] **Comments** on tours.
- [ ] **Feed modes** on Explore: Recent / Popular / Following.
- [ ] **Notifications** (new follower, like, comment).
- [ ] **Profile polish** — avatars, banners, social links, pinned tours, counts.

### Milestone 4 — Monetization (billing was always planned)

Mirror the proven Kuula ladder (Free → ~$20 Pro → ~$36 Business/yr).

- [ ] **Plans & billing** (Stripe): Free (capped uploads/storage, badge) → Pro
  (unlimited, remove badge, private/unlisted, analytics) → Business (custom
  domain, team seats).
- [ ] **Creator analytics** — views, unique viewers, embed referrers, hotspot
  engagement (a Pro upsell **and** a retention hook).
- [ ] **Storage/upload quotas** enforced per plan.

### Milestone 5 — Editor depth (moat)

Close the feature gap with pro builders.

- [ ] **Floor-plan / map hotspots** (mini-map with scene pins).
- [ ] **Auto-rotate** + smoother initial-view authoring.
- [ ] **Background audio** + ambient narration per scene.
- [ ] **Nadir/zenith patch** (logo cap over the tripod hole).
- [ ] **Richer media hotspots** — inline video, image galleries, audio.
- [ ] **Scene transitions** (fade / blend) on navigation.
- [ ] **Measurement / info cards** overlays.

### Milestone 6 — Platform & integrations

- [ ] **Public REST API + API keys** for programmatic tour management.
- [ ] **OAuth / signed embeds** for partners.
- [ ] **Import** from Google Street View / common 360 cameras; **bulk upload**.
- [ ] **`cubemap` projection** support (already reserved in the type).
- [ ] **Webhooks** (tour published / viewed thresholds).
- [ ] **CMS plugins** (WordPress / Wix / Webflow embed blocks).

### Quick wins (cheap, high ROI — do anytime)

- [ ] Open Graph/meta tags on tour pages (tiny effort, big share/SEO payoff).
- [ ] "View in fullscreen / VR" + auto-rotate toggles in the viewer (PSV plugins
  are already installed).
- [ ] Tour thumbnails on Explore / profile cards (we already generate
  `thumbnailUrl` on upload).
- [ ] `coverUrl` selection in the studio (the column already exists on `Tour`).

> Suggested order: **Milestone 2 first** — the `/embed` route + Share dialog
> unlock the growth loop and build directly on code that already exists.
