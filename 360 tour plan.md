# 360° Image + Hotspot Studio — Implementation Plan

A plan for adding interactive 360° panorama viewing and a hotspot authoring
"studio" to your project. The design separates two concerns cleanly:

- **Studio (authoring):** place clickable hotspots on a panorama, save data.
- **Viewer (runtime):** load a panorama + its saved hotspots, read-only, with VR.

Author once, store the data, render it anywhere. The studio never ships to end
users; only the lightweight viewer does.

---

## 1. Architecture at a glance

```
                 ┌──────────────────────────────────────────┐
                 │                 STUDIO                     │
   panorama  →   │  Three.js sphere + raycast hotspot editor  │  → JSON
   (image)       │  (the sphere-studio tool, embedded in /admin)│   (hotspots)
                 └──────────────────────────────────────────┘
                                      │  save
                                      ▼
                 ┌──────────────────────────────────────────┐
                 │              BACKEND / STORAGE             │
                 │  images → object storage / CDN             │
                 │  metadata (tours, scenes, hotspots) → DB   │
                 └──────────────────────────────────────────┘
                                      │  load
                                      ▼
                 ┌──────────────────────────────────────────┐
                 │                 VIEWER                     │
   end user  ←   │  Photo Sphere Viewer + markers/virtual-tour│
                 │  plugins, VR mode (WebXR)                  │
                 └──────────────────────────────────────────┘
```

**Recommended libraries**

| Layer | Choice | Why |
|---|---|---|
| Viewer (production) | **Photo Sphere Viewer** (`@photo-sphere-viewer/core`) | Actively maintained, TypeScript, markers + virtual-tour + VR plugins |
| Studio (authoring) | **Custom Three.js** (the `sphere-studio.html` tool) | Full control over the editing UX; exports clean JSON |
| VR (optional, heavier) | A-Frame / WebXR | Only if VR is the headline feature rather than a mode |

You can also do *everything* in Three.js if you want zero third-party runtime
deps — the studio file already contains a working viewer. PSV is recommended for
production because it gives you VR, gyroscope, fullscreen, touch, and plugins for free.

---

## 2. The data model (the heart of it)

Three nested entities. Store hotspots by **angle (`yaw`/`pitch`)**, never by pixel
— angles are resolution-independent and survive re-encoding the image.

### Tour
The whole experience (e.g. one property, one showroom).

| Field | Type | Notes |
|---|---|---|
| `id` | string | uuid |
| `title` | string | |
| `startSceneId` | string | which scene loads first |
| `scenes` | Scene[] | one or more panoramas |
| `createdAt` / `updatedAt` | ISO date | |

### Scene
One panorama and its hotspots.

| Field | Type | Notes |
|---|---|---|
| `id` | string | uuid |
| `name` | string | "Living room" |
| `image` | object | see Image asset below |
| `initialYaw` / `initialPitch` | number (deg) | where the camera faces on entry |
| `initialFov` | number (deg) | default ~75 |
| `hotspots` | Hotspot[] | |

### Hotspot
A point of interest.

| Field | Type | Notes |
|---|---|---|
| `id` | string | uuid |
| `type` | enum | `info` \| `link` \| `scene` \| `media` |
| `label` | string | shown as tooltip |
| `content` | string | description / HTML / caption |
| `yaw` | number (deg) | horizontal angle |
| `pitch` | number (deg) | vertical angle, clamp ±89 |
| `targetSceneId` | string? | only when `type === "scene"` (navigation) |
| `url` | string? | only when `type === "link"` or `"media"` |
| `icon` | string? | which pin image to render |

### Image asset

| Field | Type | Notes |
|---|---|---|
| `url` | string | CDN URL of the equirectangular image |
| `width` / `height` | number | should be 2:1 |
| `projection` | enum | `equirectangular` (default) \| `cubemap` |
| `thumbnailUrl` | string? | for the scene gallery |

### Example JSON

```json
{
  "id": "tour_001",
  "title": "Model Apartment",
  "startSceneId": "scene_living",
  "scenes": [
    {
      "id": "scene_living",
      "name": "Living Room",
      "image": { "url": "https://cdn.example.com/living.jpg", "width": 4096, "height": 2048, "projection": "equirectangular" },
      "initialYaw": 0, "initialPitch": 0, "initialFov": 75,
      "hotspots": [
        { "id": "h1", "type": "info",  "label": "Smart TV", "content": "65\" OLED", "yaw": 34.2, "pitch": -3.1 },
        { "id": "h2", "type": "scene", "label": "To Kitchen", "yaw": 110.0, "pitch": -8.0, "targetSceneId": "scene_kitchen" }
      ]
    }
  ]
}
```

---

## 3. Image pipeline (what the studio and viewer need)

**Source requirement:** a true **equirectangular** image with a **2:1 aspect ratio**
(width = 2 × height). Anything else looks warped at the poles.

**Recommended sizes**

| Use | Size | Notes |
|---|---|---|
| Mobile / fast load | 2048 × 1024 | loads fast, looks fine on phones |
| Desktop / VR sweet spot | 4096 × 2048 | best quality-to-size balance |
| Maximum | 8192 × 4096 | most GPUs cap texture size at 8192; going higher rarely helps |

**Format:** `.jpg` for photos (smallest), `.webp` if you want better
compression and your browser targets allow it, `.png` only when you need lossless.

**Hosting & CORS:** serve panoramas from **your own domain / CDN**. WebGL texture
uploads require CORS headers on cross-origin images, or the texture silently fails.
On Vercel, put images in object storage (e.g. an S3-compatible bucket or Vercel
Blob) with `Access-Control-Allow-Origin` set, and load with `crossOrigin`.

**Optional processing on upload:** validate 2:1 ratio, generate a downscaled
mobile variant + a thumbnail, strip/normalise XMP `GPano` metadata.

---

## 4. Backend / API

Keep it as plain CRUD. If you're on Next.js/Vercel, these map to API routes.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/upload` | accept image file → store on CDN → return `{url, width, height}` |
| `GET` | `/api/tours/:id` | full tour JSON (used by the **viewer**) |
| `POST` | `/api/tours` | create a tour |
| `PUT` | `/api/tours/:id` | save scenes + hotspots from the **studio** |
| `DELETE` | `/api/tours/:id` | remove |

**Storage options**
- Metadata: any DB (Postgres/Mongo) — store the tour as JSON, or normalise into
  `tours` / `scenes` / `hotspots` tables.
- Images: object storage + CDN (never commit panoramas to the repo).

**Auth:** the studio routes (`POST`/`PUT`/`DELETE`, `/api/upload`) must be behind
auth; the `GET` viewer route can be public.

---

## 5. Studio (authoring) — what to build

You already have the working tool (`sphere-studio.html`). To productionise it:

**Must-have features**
- Load panorama (upload → `/api/upload`).
- Click sphere → raycast → `{yaw, pitch}` → create hotspot.
- Edit panel: label, content, type, target scene / url.
- Hotspot list with select / delete.
- Live yaw/pitch readout (helps precise placement).
- Save → `PUT /api/tours/:id`. Load existing tour to edit.

**Add for multi-scene tours**
- Scene switcher (add / rename / reorder scenes).
- Hotspot `type: "scene"` with a dropdown to pick the target scene.
- Set per-scene initial yaw/pitch/fov (where the camera faces on entry).

**Nice-to-have**
- Drag an existing hotspot to reposition (re-raycast on drag).
- Undo/redo.
- Preview toggle (your existing Edit/View switch).

---

## 6. Viewer (runtime) — how to show it

Production viewer with Photo Sphere Viewer. Core flow:

```js
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

const tour = await fetch(`/api/tours/${id}`).then(r => r.json());

const viewer = new Viewer({
  container: 'viewer',
  panorama: scene.image.url,
  defaultYaw: scene.initialYaw + 'deg',
  navbar: ['zoom', 'fullscreen'],   // add 'vr' for headsets
  plugins: [
    [MarkersPlugin, {
      markers: scene.hotspots.map(h => ({
        id: h.id,
        position: { yaw: h.yaw + 'deg', pitch: h.pitch + 'deg' },
        image: '/pins/' + (h.icon || 'pin.png'),
        size: { width: 32, height: 32 },
        anchor: 'bottom center',
        tooltip: h.label,
        data: h,                      // keep full hotspot for the click handler
      })),
    }],
  ],
});

const markers = viewer.getPlugin(MarkersPlugin);
markers.addEventListener('select-marker', ({ marker }) => {
  const h = marker.config.data;
  if (h.type === 'scene') loadScene(h.targetSceneId);  // navigate
  else if (h.type === 'link') window.open(h.url, '_blank');
  else showPanel(h.label, h.content);                  // info / media
});
```

The **Copy PSV config** button in the studio already emits markers in exactly
this `{ id, position: { yaw, pitch }, ... }` shape, so authoring and rendering
share one format.

**React/Next:** use `react-photo-sphere-viewer` and pass the same `plugins` array
as a prop. Render the viewer client-side only (`ssr: false` / dynamic import) —
it touches `window`.

---

## 7. Multi-scene navigation

Two ways to move between panoramas:

1. **Manual swap** — on a `scene` hotspot click, call `viewer.setPanorama(url)`
   and reset the markers for the new scene. Simple, full control.
2. **Virtual Tour plugin** — feed it all scenes + their links and it handles
   navigation arrows, transitions, and optional GPS. Less code, less control.

For most product tours (real estate, showrooms), option 1 with your own scene
hotspots is plenty and keeps the data model simple.

---

## 8. VR support

- Photo Sphere Viewer ships a VR/stereo mode — add `'vr'` to the navbar; it uses
  WebXR and works with gyroscope on mobile and with headsets (Quest, etc.).
- If VR becomes the *primary* experience rather than an option, move the viewer to
  **A-Frame** (`<a-sky src="pano.jpg">` + entities for hotspots) — it's the
  strongest WebXR framework, at the cost of being a whole framework to learn.

---

## 9. File / module structure (suggested)

```
/360
  /studio
    SphereStudio.(jsx|html)    # authoring tool (from sphere-studio.html)
    raycast.js                 # click → yaw/pitch helpers
  /viewer
    TourViewer.jsx             # PSV wrapper, loads tour JSON
    hotspot-handlers.js        # select-marker → navigate / panel / link
  /lib
    types.ts                   # Tour / Scene / Hotspot interfaces
    api.ts                     # fetch wrappers for /api/tours, /api/upload
  /api (or backend routes)
    upload, tours[id]
/public/pins/                  # marker icons
```

---

## 10. Gotchas checklist

- [ ] Images are **exactly 2:1** equirectangular, else poles look stretched.
- [ ] Cross-origin images have **CORS headers** + `crossOrigin` set, or textures fail.
- [ ] Keep panoramas **≤ 8192 px** wide (GPU texture limit).
- [ ] Store hotspots in **degrees**, not pixels.
- [ ] Render the viewer **client-side only** (no SSR).
- [ ] Put studio/upload/save endpoints **behind auth**; viewer GET can be public.
- [ ] Provide a **mobile-sized** image variant to keep load times down.
- [ ] Give every scene an **initial yaw/pitch** so users enter facing the right way.

---

## 11. Build order (phased)

**Phase 1 — Single panorama viewer.** PSV loads one image, no hotspots. Confirm
it renders, drags, and is responsive. *(½ day)*

**Phase 2 — Studio MVP.** Embed the Three.js studio, click-to-place hotspots,
export JSON to a file. *(you already have this)*

**Phase 3 — Persistence.** `/api/upload` + `/api/tours` CRUD; studio saves/loads
from the backend instead of files. *(1–2 days)*

**Phase 4 — Viewer renders saved hotspots.** Wire `select-marker` to info panels
and external links. *(1 day)*

**Phase 5 — Multi-scene tours.** Scene management in the studio + `scene` hotspots
that navigate in the viewer. *(2–3 days)*

**Phase 6 — Polish.** VR button, gallery/thumbnails, mobile tuning, custom pins.
*(ongoing)*