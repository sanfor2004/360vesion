# Local architecture audit — 2026-09-08

## Decision

360Vision is a single-owner local studio. Visibility and community metadata had
no authorization value and only supported obsolete discovery/distribution UI.

## Removed product logic

- draft/public/unlisted visibility
- owner profile and owner metadata
- slugs, cover metadata, and view counters
- Explore and profile routes
- share dialog and embed route
- sitemap, robots route, and canonical-site configuration
- local identity/auth compatibility module
- unused Photo Sphere Viewer virtual-tour dependency

## Retained local core

- My work dashboard
- Studio authoring and autosave
- direct local Viewer and bundled demo
- portable JSON projects and atomic writes
- panorama, icon, and floor-plan upload processing
- scenes, hotspots, starting views, multi-floor maps, and Auto tour

## Compatibility

Older JSON containing removed fields is validated and loaded. Unknown legacy
fields are stripped atomically while preserving the project timestamps. Both
existing local project files were normalized successfully.

## Validation

- TypeScript: passed
- Production build: passed
- Root redirects to `/dashboard`
- Removed routes return 404
- API list omits legacy fields
- Create/save/reload/delete persistence round-trip passed
- Dashboard and Studio inspected at desktop and mobile capture sizes
- Studio and Viewer floor selectors use the shared ActionButton component
