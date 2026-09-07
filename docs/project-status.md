# Project Status and Remaining Work

## Working today

360Vision already supports the core local workflow: creating a tour, uploading valid equirectangular panoramas, authoring scenes and hotspots, assigning rooms to optional multi-floor plans, automatic SQLite saving, and viewing tours with map, room rail, fullscreen, gyroscope/stereo support, previous/next navigation, and Auto tour.

The site is now standardized on Inter for general UI text, with shared primitives for actions, headers, empty states, and status feedback documented in [UI Components](ui-components.md).

## Highest-priority remaining work

1. **Data protection and portability** — implement a complete tour package import/export flow that includes referenced media, then publish clear backup and restore instructions for `prisma/dev.db` and `public/uploads`.
2. **Authoring safeguards** — add confirmation dialogs for scene and floor deletion; validate missing scene targets, duplicate/missing map references, and incomplete tours before public sharing.
3. **Studio organization** — support scene reordering and, if needed after usability testing, direct drag repositioning of floor-plan points.
4. **Accessibility and responsive review** — test the documented phone, tablet, laptop, and desktop sizes; verify keyboard navigation, focus indicators, accessible names, reduced-motion behavior, and text overflow.
5. **Reliability feedback** — replace remaining browser `alert` calls and vague database failures with reusable `StatusNotice` feedback and recovery guidance.
6. **Styling infrastructure** — investigate why Tailwind and daisyUI utility classes are not emitted in the current live build. The new shared primitives deliberately use the established CSS-module token pattern so they remain reliable in the meantime.

## Before any public deployment

The current architecture is intentionally local and single-owner. It writes assets to `public/uploads` and uses SQLite. Do not deploy editable tours to an ephemeral or multi-instance host until persistent database and object storage have been selected and the storage seam has been replaced.

The API has no authentication by design. If the product direction changes to a network-accessible, multi-user application, authentication and authorization must be designed deliberately rather than added piecemeal.

## Quality gate for future changes

Run `npm run lint` and `npm run build` for implementation changes. For Prisma schema changes, also run `npm run db:generate` and `npm run db:push`. Viewer and Studio changes require desktop and mobile visual checks described in the [validation plan](validation-plan.md).
