# Marketing production validation

- Final deliverables: `public/markting/` (36 files, approximately 46.5 MiB).
- Two 30-second campaign videos: 1920×1080 and 1080×1920, H.264 / 24 fps.
- One 10-second real panorama clip, two optimized looping GIFs.
- Four portrait feature cards, four carousel variants, hero/social/blog images,
  generated lifestyle/product photography, and nine actual UI captures.
- README includes both GIFs, the hero, and the current implemented feature set.
- Local social captions, Medium article, and Astro blog draft included.

## Checks

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed; expected local routes retained.
- `git diff --check`: passed (only Windows line-ending advisory).
- Real app captures: 1440×900 desktop and 390×844 mobile; zero page errors.
- Gallery: 1440×1000 and 390×844; no broken local links or horizontal overflow.
- Both campaign videos load and seek in Chrome, report 30 seconds and expected
  dimensions, and reach readyState 4.
- All three MP4s and both GIFs pass complete FFmpeg decode checks.
- Encoded scene review frames saved under `temp/marketing/review-*.png`.
- Inspected hero, map, Studio, lifestyle, closing, portrait, carousel, and
  mobile gallery outputs. Corrected shorter-card text/device overlap and
  kept the Studio inspector visible in the campaign frame.
- Reduced GIF sizes to 3.68 MiB (overview) and 4.01 MiB (navigation).

Machine-readable checks: `temp/marketing/capture-report.json` and
`temp/marketing/export-validation.json`.

## Scope and handoff

The capture workflow creates/reuses the dedicated Cedar House marketing sample
through the local API. It leaves the sample available in My work. Existing
personal tour records were not selected for the campaign.

Lifestyle and hardware imagery are built-in image-generation outputs. Actual
feature screens and panorama motion are captured from the running application.
Videos are silent. ASO compositions are web-product campaign cards, not native
App Store submission assets. Pinterest access failed; the four supplied boards
and existing brand guidance informed the original compositions.

No external posting or deployment was performed. The blog draft follows the
existing blog repository's documented Astro frontmatter and remains draft:true.
The local preview is served at http://127.0.0.1:3010/markting/index.html while
the preview process remains running.
