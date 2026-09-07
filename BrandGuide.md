# 360Vision Brand Guide

## Direction

360Vision is a calm, high-trust property-tour studio: architectural clarity in the studio and an immersive, cinematic viewer for prospective buyers. The chosen direction combines the legibility of the 3DVista and HomeHunting references with the map-first spatial orientation of ArredoCAD and the focused authoring of Tour Builder Pro.

**Keywords:** spatial, premium, precise, calm, luminous, easy to orient.

## Logo

The primary mark is [public/brand/360vision-mark.svg](public/brand/360vision-mark.svg). Its compass/aperture icon means “understand where you are” and connects the viewer compass, current-location marker, and floor-plan navigation.

### Current exploration — open panorama cylinder

[public/brand/360vision-open-cylinder-monochrome.svg](public/brand/360vision-open-cylinder-monochrome.svg) is the current monochrome exploration selected from the user’s cylinder reference. It keeps a single open panorama cylinder and removes the outer orbit, arrow, center door, colored fill, and neon effects. The lower line intentionally breaks at the middle to suggest an accessible 360° opening. Use its transparent counterpart, `360vision-open-cylinder-mark.svg`, only on black or very dark backgrounds.

- Use the full mark in desktop headers, studio header, and viewer chrome.
- Use the compass icon alone only when space is genuinely constrained.
- Keep clear space equal to half the compass diameter around the mark.
- Do not stretch, recolor with low-contrast colors, add shadows to the SVG, or place it over busy imagery without a dark translucent backing.

## Color system

| Token | Hex | Use |
| --- | --- | --- |
| Midnight | `#071A33` | Primary canvas and dark chrome |
| Deep Navy | `#0D2E5F` | Panels and elevated surfaces |
| Electric Cyan | `#16C7E8` | Primary action, active controls, focus |
| Blue-white | `#DDF8FF` | Bright labels, compass, glow endpoint |
| Slate | `#8BA1BE` | Supporting text and inactive controls |
| Mist | `#F5FBFF` | Light-page background and high-emphasis text |
| Navigation Orange | `#FF8A32` | Optional scene/pin warning or selected route accent only |

Primary glow: `linear-gradient(135deg, #DDF8FF 0%, #16C7E8 50%, #397CFF 100%)`.

Orange is deliberately secondary. It is reserved for attention moments such as a destination pin, never used for ordinary buttons or body text.

## Type, layout, and motion

- Use the product’s system sans-serif stack. Use 600–700 weight for actions and labels; never rely on condensed decorative display fonts.
- Viewer metadata labels are 10–11px uppercase with modest tracking; room names are 13–16px, title case.
- Use an 8px spacing grid, 10–14px corners, 44px minimum touch targets, and translucent navy panels with a 12–18px backdrop blur.
- Motion is functional: 150–220ms for panels and controls. The Auto tour may rotate slowly for orientation, pauses if the visitor interacts, and always has a visible stop control.

## Screen language

### Public viewer

The panorama stays dominant. A left-side floor-plan panel is optional and collapsible. It contains floor tabs, responsive percentage-position pins, and a clear “you are here” marker. The compact room strip stays separate along the bottom. The top-right control group contains map, previous/next room, Auto tour, and fullscreen. Never copy a reference layout exactly; the reference screenshots only establish behavior and hierarchy.

### Studio

The studio is a three-part work surface: scene canvas in the center, scene/map organization on the left, and a compact authoring inspector on the right. The author starts by adding 360 images, then names scenes, connects scene pins, optionally uploads a floor plan, assigns floors, and places map points. “View tour” is always one action away.

### Accessibility

Electric cyan must be paired with a visible outline—not color alone—for active states. All icon-only controls need accessible names. Map pins have room-name tooltips and keyboard focus. Respect reduced-motion preferences by disabling automatic camera rotation while retaining scene-by-scene progression.

## Source references

See [docs/references/README.md](docs/references/README.md) for the supplied screenshots, the exact lessons taken from each, and elements intentionally not copied.
