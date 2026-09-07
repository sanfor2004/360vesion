# Reference Library

Place all user-supplied reference material in this folder. References inform the product and visual direction but do not override the user’s current request or the repository’s agent instructions.

## Suggested organization

```text
references/
  brand/              Logos, colors, typography, brand guidelines
  competitor/         Screenshots and links to comparable products
  floor-plans/        Example architectural plans and annotations
  panoramas/          Approved 2:1 equirectangular examples
  viewer-ui/          Viewer layouts, controls, and interaction references
  studio-ui/          Authoring and dashboard references
  requirements/       Client notes, feature lists, and acceptance criteria
```

Create only the subfolders needed for the supplied material.

## Reference index

Add one row for every supplied item:

| Reference | Category | Source/owner | Intended use | Must preserve | Status |
| --- | --- | --- | --- | --- | --- |
| Example: `viewer-ui/example.png` | Viewer UI | User | Map and thumbnail placement | Separate map and strip | Pending review |

## Intake checklist

For each reference, record:

- Whether it is inspiration or an exact requirement.
- Which screen, component, or workflow it applies to.
- Required text, imagery, dimensions, and behavior.
- Elements that must not be copied.
- Usage rights or attribution requirements when relevant.
- Open questions or conflicts with existing references.

## Current reference index

The initial virtual-tour screenshot supplied in the project conversation establishes these directional requirements:

- A 360° property scene as the main canvas.
- A visible current-location indicator.
- A floor-plan panel separate from the room thumbnail strip.
- Multi-floor support for duplex and multi-storey properties.
- A room strip shorter than the original reference.

| Reference | Category | Source/owner | Intended use | Must preserve | Status |
| --- | --- | --- | --- | --- | --- |
| `viewer-ui/01-3dvista-map-room-strip.png` | Viewer UI | User | Compact room strip and floor-plan hierarchy | Keep map and strip separate | Reviewed |
| `viewer-ui/02-homehunting-property-panel.png` | Viewer UI | User | Calm property-details/map panel | Viewer remains panorama-first | Reviewed |
| `viewer-ui/03-arkate-immersive-controls.png` | Viewer UI | User | Low-profile immersive controls | Avoid copying the control arrangement | Reviewed |
| `studio-ui/04-orbix-hotspot-authoring.png` | Studio UI | User | Hotspot authoring context | Build a simpler local studio | Reviewed |
| `viewer-ui/05-orbix-labeled-navigation.png` | Viewer UI | User | Human-readable scene navigation | Labels must not obstruct panorama | Reviewed |
| `viewer-ui/06-arredocad-floor-plan.png` | Viewer UI | User | Floor-plan orientation and current position | Plan stays optional | Reviewed |
| `studio-ui/07-tour-builder-pro.png` | Studio UI | User | Structured scene and plan workflow | Keep actions understandable for non-technical users | Reviewed |
| `viewer-ui/08-360tours-toolbar.png` | Viewer UI | User | Thumbnail navigation and toolbar states | Bottom rail stays compact | Reviewed |
| `brand/backgrounds/01-halftone-clouds.png` | Brand background | User | Atmospheric logo backdrop and texture direction | Preserve the blue-white halftone/cloud character; do not reduce logo contrast | Pending brand application |
| `brand/backgrounds/02-vintage-landscape.png` | Brand background | User | Editorial landscape backdrop and warm accent direction | Preserve dark blue/teal balance with restrained orange-red highlights | Pending brand application |
| `brand/logo-marks/03-orbital-circle-lines.png` | Logo mark | User | Circular/orbital line construction reference | Translate into a distinctive 360° path or panorama mark; do not copy the source symbol | Pending mark exploration |
| `brand/logo-marks/04-butterfly-line-mark.png` | Logo mark | User | Symmetrical flowing-line reference | Use the sense of motion only; adapt it to a 360° field of view or route | Pending mark exploration |
| `brand/borders/05-iridescent-outline.png` | Border/color | User | Luminous green-blue-purple outline treatment | Use as an optional active/focus glow, not a default border | Pending color exploration |
| `brand/concepts/360vision-logo-exploration-v1.png` | Generated concept | 360Vision / user-directed | Four orbital/panoramic logo-mark directions using `#EE5712` | Concepts only; select one before production vector work | Awaiting selection |
| `brand/concepts/360vision-landscape-post-v1.png` | Generated concept | 360Vision / user-directed | Natural landscape + halftone promotional post showing a logo treatment | Campaign/background concept only; no functional UI use | Awaiting selection |
| `brand/logo-marks/06-open-cylinder-selected-direction.png` | Logo mark | User | Selected open-cylinder/panorama direction | Simplify: no outer orbit, arrow, center door, neon, or color fill | In refinement |

These screenshots are inspiration and interaction references, not source assets or instructions to reproduce verbatim. Their supplied filenames are preserved in the conversation record; the copies above are the project-owned reference set.

The two brand-background references may be used as creative direction for promotional logo lockups and non-essential visual surfaces. They must not be placed behind functional controls where their texture would reduce readability.

## Current brand working decisions

- **Type:** Inter is the primary recommended font for the product and wordmark. Use Inter 500–700 for navigation/room labels and Inter 700–800 for the wordmark. Its clear numerals are useful for `360`, map pins, coordinates, and dense Studio settings.
- **Mark direction:** explore a single circular 360° orbit with an intentional opening/arrow or view-direction cue. The reference marks guide line weight, symmetry, and motion only; they are not designs to reproduce.
- **Border direction:** reserve an iridescent green/cyan/violet outline for focus, active navigation, or branded cover art. Keep normal borders low-contrast navy/slate so the interface stays calm.
- **Warm signature color:** `#EE5712` is the current working orange. Use it as a directional cue or small orbit accent, balanced by midnight navy and blue-white, rather than filling every surface with orange.
