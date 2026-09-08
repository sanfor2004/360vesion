# Marketing production workflow

## Creative rules

Campaign idea: **Every space. A new perspective.** Audience: property teams,
creative developers, and people following the project's development.

Use the existing 360Vision wordmark/white cylinder symbol, Inter type, midnight
navy, cyan highlights, and restrained `#EE5712` warmth. Editorial italic words
add emphasis to short headlines. Keep titles separate from readable product
screens and preserve generous edge spacing.

Use real UI for feature demonstrations. Use illustrative photography for
emotional context. Avoid unsupported claims, invented ratings, testimonials,
affiliations, cloud sharing, or native-app availability.

Reference interpretation:

- User Image 1: consistent portrait sequence, short feature headlines, device
  framing, and a clear text/product hierarchy.
- User Image 2: dimensional product shots, floating interface layers, and
  bold contrast. Exclude its rankings, pricing, awards, and brand marks.
- User Image 3: a coherent campaign palette, cinematic lighting, and a hero
  composition that carries across different crops.
- User Image 4: human context, warm/cool light, and editorial framing.
- `https://www.pinterest.com/pin/333759022406760643/`: supplied reference;
  attempted access returned an error, so no unseen details were assumed.
- Existing brand guidance: `docs/references/README.md` and the production
  cylinder symbol at `public/brand/360studio-symbol.svg`.

## Review loop

1. Read the current product docs and verify each proposed feature claim.
2. Capture a dedicated sample project through the real browser. Keep personal
   project data out of the campaign; capture scripts use bundled Cedar House assets.
3. Generate lifestyle/product photography, then inspect lighting, anatomy,
   hardware, and screen fidelity. Keep original generated files.
4. Compose desktop, square, carousel, and portrait layouts from editable source.
5. Inspect full-size and reduced previews. Correct text overlap, clipped
   key controls, hierarchy, and unsafe edge placement; rerender affected assets.
6. Render motion, encode MP4, and derive GIFs from the actual encoded videos.
7. Decode-check media, inspect frames across every scene, and verify references
   in the gallery and README. Run project lint/build after source/doc updates.
8. Review the article/captions and publish through the destination account.
   Asset generation itself does not post or deploy anything.

## Reproduction

Start a production server on `127.0.0.1:3010` after `npm run build`:

```text
npm run start -- --hostname 127.0.0.1 --port 3010
npm install --prefix temp/marketing-tools --no-audit --no-fund playwright ffmpeg-static
node temp/marketing-tools/node_modules/ffmpeg-static/install.js
node scripts/marketing/capture.cjs
node scripts/marketing/render.cjs
```

Chrome must be installed. The browser capture uses headless Chrome with a
software WebGL renderer; other machines may require a different browser channel.
Tool installation needs network access. The FFmpeg installation step is explicit
because package install scripts may be blocked by local npm policy.

Set `MARKETING_BASE_URL` to use another local server address. The capture script
creates/reuses `Cedar House · Marketing Demo` through the existing tours API.
It does not edit pre-existing user projects. It leaves that useful sample in
My work. Frames and the sample ID are recorded under `temp/marketing/`.

`scripts/marketing/stage.html` contains editable copy, layout, and motion.
`render.cjs --stills-only` regenerates the PNG cards without rendering video.
`render.cjs --gifs-only` rebuilds optimized GIFs from the existing MP4 files.
`node scripts/marketing/verify.cjs` checks media decoding, gallery links,
horizontal overflow, and video playback at desktop and mobile sizes.
Rendering replaces the named campaign outputs; save a copy before revising a
released campaign. Temporary tool dependencies are not app dependencies.

Final files: `public/markting/`. Temporary JPEG frames, capture diagnostics,
and export checks: `temp/marketing/`. Marketing report: `temp/reports/`.

## Timeline

| Time | Message | Visual |
| --- | --- | --- |
| 0–5 s | Every space. A new perspective. | Real viewer capture, title entrance |
| 5–10 s | Let the room tell its story. | Recorded panorama drag and room change |
| 10–15 s | Every room. One clear path. | Recorded map/room navigation |
| 15–20 s | Your vision. In the details. | Studio capture and feature callout |
| 20–25 s | Spaces worth spending time in. | Lifestyle photograph, slow push |
| 25–30 s | Make every space a story. | Product studio photograph and portfolio URL |

Both final films are 24 fps, H.264, yuv420p, fast-start MP4. They are silent;
on-screen copy and the transcript communicate the story. Raw panorama footage
contains 240 browser frames replayed at 24 fps; its interaction timing is edited.

## Image-generation prompts

Mode: built-in image generation, followed by editable HTML campaign layouts.

### Lifestyle photograph

Use case: ads-marketing. Create a photorealistic lifestyle hero photograph for
360Vision, a local real-estate virtual tour authoring tool. Landscape 16:9 image.
An architect/property professional in a warm contemporary villa, viewed in
elegant side profile, seated at a walnut table using a thin unbranded dark
laptop, with softly lit glass walls and garden behind. Laptop screen angled
away, no readable UI. Human warmth and dimensional cinematic framing inspired
by editorial character-led product campaigns; polished technology launch
photography. Warm late-afternoon orange light (#EE5712 accents) balanced with
midnight teal shadows, real skin and linen fabric texture, restrained cyan
reflected light. Subject and laptop occupy right two thirds; left third is
dark uncluttered negative space for later marketing typography. Premium
realistic photography, subtle film grain, not an illustration. No text, no
logos, no watermark, no invented ratings or testimonials. This is an original
lifestyle scene, not a recreation of any reference people.

### Product studio photograph

Use case: product-mockup. Create a premium photorealistic studio product shot
advertising 360Vision virtual tour software. Landscape 16:9. Input image 1 is
the real product screen to display on the laptop, preserve its recognizable
interface and villa panorama. A single beautifully crafted unbranded graphite
laptop, open at a natural working angle, three-quarter view on a low charcoal
circular pedestal. Dark midnight studio, soft cyan rim light from left and
subtle warm orange reflection from right, elegant controlled reflections,
faint volumetric atmosphere, premium technology launch aesthetic. Screen fully
visible with the supplied real 360Vision screenshot composited accurately;
no additional invented interface. Laptop occupies right two thirds, left third
dark and clear for future title. No added text, no logos on hardware, no
watermarks, no Microsoft or Apple logos. Crisp product edges, physically
plausible hinge keyboard and trackpad, sophisticated restrained lighting.

Screen reference: `public/markting/screenshots/viewer-desktop.png`.

## Publishing handoff

The blog's existing README was read through GitHub. It specifies Astro Markdown
under `src/content/blog/`, with `title`, `description`, `pubDate`, `category`,
`tags`, and optional `draft`. The supplied draft follows that convention.

Copy final assets into the blog before publishing so `/markting/` links resolve.
Medium and social platforms need their own uploaded attachments; local file
links will not work there. Posting access for Medium/Facebook/LinkedIn was not
available among this session's exposed tools; plugin search was also not exposed.
The provided captions and article are reviewable local drafts.
