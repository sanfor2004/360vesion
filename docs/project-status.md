# Project Status and Remaining Work

## Working

The local workflow supports project creation, atomic autosave, Save as, JSON
download, panorama processing, scene/hotspot authoring, optional multi-floor
plans, synchronized Viewer navigation, Auto tour, and WebGL recovery.

The previous community/publication subsystem has been removed. Tours have no
visibility, owner profile, slug, view counter, Explore listing, share dialog,
embed page, sitemap, or authentication metadata.

Generated builds, logs, traces, caches, reports, and screenshots are consolidated
under `temp/`.

## Remaining priorities

1. Complete media-aware package import/export.
2. Confirm destructive scene/floor actions and validate broken references.
3. Add scene reordering.
4. Complete accessibility and responsive validation.
5. Replace remaining browser alerts with reusable recovery feedback.
