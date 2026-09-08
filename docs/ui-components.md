# Reusable UI Components

The shared UI primitives live in `components/ui/`. They provide consistent accessible markup and use the project’s CSS-module tokens for the standard states that appear across the site. Prefer these components to duplicating button, empty-state, page-title, or inline-feedback markup.

The project self-hosts **Inter** through `@fontsource-variable/inter`, so production builds do not depend on Google Fonts or another external font service. The Studio retains a monospace face only for compact coordinate and save-status readouts where aligned numerals are useful.

## Import

```tsx
import {
  ActionButton,
  ActionLink,
  EmptyState,
  PageHeader,
  StatusNotice,
} from "@/components/ui";
```

## `ActionButton`

Use for actions that run code, submit a form, or change local state. It passes ordinary button props through, including `disabled`, `onClick`, and `type`.

```tsx
<ActionButton tone="primary" onClick={saveTour} disabled={saving}>
  {saving ? "Saving…" : "Save changes"}
</ActionButton>
```

Supported `tone` values are `default`, `primary`, `ghost`, `outline`, and `error`. Supported `size` values are `xs`, `sm`, `md`, and `lg`.

## `ActionLink`

Use for internal navigation that should look and behave like a button.

```tsx
<ActionLink href="/dashboard" tone="primary">
  Open my work
</ActionLink>
```

It supports `default`, `primary`, `ghost`, and `outline` tones, plus the same size values as `ActionButton`.

## `PageHeader`

Use once near the start of a page for a title, optional context, and optional actions. It stacks naturally on small screens.

```tsx
<PageHeader
  eyebrow="LOCAL PROJECT LIBRARY"
  title="My work"
  description="12 local tours"
  actions={<ActionLink href="/studio/new" tone="primary">New tour</ActionLink>}
/>
```

## `EmptyState`

Use when a list, gallery, or workspace has no data. Keep the description focused on the next useful step and expose no more than one primary action.

```tsx
<EmptyState
  title="No scenes yet"
  description="Upload a 2:1 panorama to create the first room."
  action={<ActionButton onClick={openUpload}>Upload panorama</ActionButton>}
/>
```

## `StatusNotice`

Use for persistent or inline feedback that needs to be announced as an alert. It supports `info`, `success`, `warning`, and `error` tones.

```tsx
<StatusNotice tone="error" title="Could not save">
  Check the local database connection and try again.
</StatusNotice>
```

## Contribution rules

- Use the project’s semantic CSS tokens through these primitives; do not add one-off hex colors to page JSX.
- Keep visual states accessible without color alone. Buttons need text or an accessible label; notices should explain recovery when an action failed.
- Add a new primitive only after checking whether one of these can express the need. Keep new props small and broadly reusable.
- Keep the component, this guide, and at least one real application use in the same change.
