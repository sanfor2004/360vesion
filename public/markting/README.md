# 360Vision marketing pack

Open [the preview gallery](index.html) through the local app at
`/markting/index.html`. The folder spelling `markting` is intentional.

## Deliverables

| Asset | File | Canvas / duration |
| --- | --- | --- |
| Product film | `video/360vision-wide.mp4` | 1920 × 1080, 30 seconds |
| Vertical film | `video/360vision-portrait.mp4` | 1080 × 1920, 30 seconds |
| Real tour footage | `video/tour-walkthrough.mp4` | 1280 × 800, 10 seconds |
| README overview | `gifs/studio-overview.gif` | 720 px wide, 15 seconds |
| Navigation loop | `gifs/tour-navigation.gif` | 560 px wide, 10 seconds |
| Hero | `images/hero.png`, `images/hero.webp` | 1920 × 1080 PNG; 1440 px WebP |
| Blog / Medium cover | `images/blog-cover.png` | 1600 × 900 |
| LinkedIn landscape | `images/linkedin-landscape.png` | 1200 × 627 |
| Facebook square | `images/facebook-square.png` | 1080 × 1080 |
| Lifestyle / product | `images/lifestyle.png`, `images/product-studio.png` | 1920 × 1080 |
| Four ASO-style cards | `images/aso-*.png` | 1080 × 1920 |
| Four carousel cards | `images/carousel-*.png` | 1080 × 1350 |
| Real application captures | `screenshots/*.png` | Desktop and 390 × 844 mobile |

The videos are H.264 MP4, 24 fps, with fast-start metadata. They are intentionally
silent and use on-screen copy. GIFs loop continuously; use MP4 for higher quality
and smaller downloads. These are campaign formats, not claims of platform-specific
submission certification.

## Copy and publishing

- [Social captions](copy/social-posts.md)
- [Blog draft](copy/360vision-blog.md), with frontmatter matching the blog's
  documented Astro content conventions
- [Medium article](copy/360vision-medium.md)

For the blog, copy this asset folder into that site's `public/markting/` and
place the blog draft in `src/content/blog/`. Review the draft and set
`draft: false` when publishing. The local Next.js studio itself requires a
server and is not deployed to GitHub Pages by copying these assets.

For Medium, paste the article body and upload the cover and GIF directly.
For social posts, attach the matching MP4 or image and use the supplied caption.
No external posts have been published by this asset-generation workflow.

## Provenance

Screenshots and panorama motion come from the real local Cedar House demo.
The lifestyle photograph and laptop studio photograph were generated with the
built-in image-generation tool. The studio photo uses a real viewer capture as
its screen reference; its hardware and surrounding setting are illustrative.
The original generated PNGs are retained beside the finished compositions.

The four supplied reference boards informed headline hierarchy, floating
screens, cinematic lighting, and a coherent campaign family. Their artwork,
people, logos, endorsements, ratings, and performance claims are not included.
The supplied Pinterest URL was attempted but could not be opened.

The ASO cards promote the current web application; no native App Store release
or Microsoft/WhatsApp affiliation is implied. Full creative rules, prompts,
source locations, and the review loop are in `docs/marketing-workflow.md`.
