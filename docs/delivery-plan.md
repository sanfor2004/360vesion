# Delivery Plan

## Delivery goal

Provide a reproducible local 360Vision workspace that opens without credentials, stores tours in SQLite, supports real-estate floor-plan navigation, and can be reviewed or demonstrated immediately.

## Milestones

### 1. Local studio baseline

Deliverables:

- Dependency installation and environment template.
- SQLite schema and generated Prisma client.
- Automatic local owner.
- Working My work, Studio, Viewer, and Demo routes.
- No login/signup pages or authentication dependencies.

Exit criteria:

- A clean local setup can create and reopen a tour.
- Type and production-build checks pass.

### 2. Real-estate navigation

Deliverables:

- Optional map toggle.
- Multi-floor authoring.
- Floor-plan uploads.
- Click-to-place scene points.
- Current-location marker and synchronized navigation.
- Independent compact room strip.

Exit criteria:

- A duplex test tour passes the studio and viewer workflows in the validation plan.

### 3. Design and accessibility polish

Deliverables:

- Final visual system based on approved references.
- Responsive behavior across agreed breakpoints.
- Keyboard and screen-reader improvements.
- Loading, empty, and error states.

Exit criteria:

- Approved desktop and mobile screenshots.
- No critical accessibility or interaction defects.

### 4. Handoff and optional publication

Deliverables:

- Updated README and docs.
- Backup/export instructions.
- Final validation evidence.
- Brand guide, Figma UI/UX specification, and archived supplied references.
- Optional deployment configuration only if a persistent database and upload store are selected.

Exit criteria:

- Local start instructions work on a clean machine.
- All delivery artifacts are listed and accessible.
- Known limitations are documented.

## Standard handoff package

- Application source code.
- `AGENT.md` and project documentation.
- `.env.example` without secrets.
- Prisma schema and setup commands.
- Demo property assets.
- Validation results and screenshots.
- Reference index.
- Backup and restore notes.

Local runtime data such as `.env`, `prisma/dev.db`, and user uploads should be handed over through a secure, intentional channel rather than committed to source control.

## Local setup sequence

```text
npm install
copy .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Then open `http://localhost:3000/dashboard`.

## Publication readiness

The current file-based upload storage and SQLite database are appropriate for a single machine. Before publishing to a server, choose infrastructure that guarantees persistent writable storage. A serverless deployment with an ephemeral filesystem is not considered production-ready for editable tours.

## Change acceptance

Each delivered change should include:

- What changed and why.
- Files or systems affected.
- Validation performed.
- Any migration or setup step.
- Known risks or follow-up work.
