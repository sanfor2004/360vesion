/**
 * Maps hotspots to Photo Sphere Viewer markers, and decides what a
 * select-marker event should do. Scene navigation (type "scene") is handled by
 * the viewer in Phase 5; here it is reported so the caller can wire it up.
 */
import type { Hotspot } from "@/lib/types";

/** Default brand color for built-in glyph pins. */
export const DEFAULT_PIN_COLOR = "#4fd1c5";

/** A handful of friendly preset colors offered in the studio picker. */
export const PIN_COLORS = [
  "#4fd1c5", // teal
  "#e8a33d", // amber
  "#e5707a", // rose
  "#7c9cf0", // blue
  "#7ed492", // green
  "#c98bdb", // purple
  "#f2f2f2", // white
  "#0d0f13", // ink
];

/**
 * Built-in pin glyphs. Each `svg` is the inner markup of a 24×24 line icon
 * (stroke-based, drawn in white inside the colored teardrop). `label` is the
 * human name shown in the picker.
 */
export const PIN_GLYPHS: Record<string, { label: string; svg: string }> = {
  dot: { label: "Dot", svg: `<circle cx="12" cy="12" r="6" fill="@c" stroke="none"/>` },
  info: {
    label: "Info",
    svg: `<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="7.5" x2="12" y2="7.6"/>`,
  },
  door: {
    label: "Door",
    svg: `<path d="M5 21h14"/><rect x="7" y="3" width="10" height="18" rx="1"/><line x1="14" y1="12" x2="14" y2="13"/>`,
  },
  window: {
    label: "Window",
    svg: `<rect x="4" y="4" width="16" height="16" rx="1"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/>`,
  },
  stairs: {
    label: "Stairs",
    svg: `<path d="M4 20h4v-4h4v-4h4v-4h4"/>`,
  },
  arrow: {
    label: "Arrow",
    svg: `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
  },
  image: {
    label: "Image",
    svg: `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/>`,
  },
  play: {
    label: "Play",
    svg: `<polygon points="7 4 20 12 7 20 7 4" fill="@c" stroke="@c"/>`,
  },
  link: {
    label: "Link",
    svg: `<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>`,
  },
  location: {
    label: "Location",
    svg: `<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/>`,
  },
  star: {
    label: "Star",
    svg: `<polygon points="12 3 14.6 8.6 21 9.3 16.5 13.6 17.8 20 12 16.8 6.2 20 7.5 13.6 3 9.3 9.4 8.6" fill="@c" stroke="@c"/>`,
  },
  home: {
    label: "Home",
    svg: `<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>`,
  },
};

/** Stable, ordered list of glyph keys for the picker. */
export const PIN_ICONS = Object.keys(PIN_GLYPHS);

/** Legacy filenames stored before named glyphs existed → glyph keys. */
const LEGACY_MAP: Record<string, string> = {
  "info.svg": "info",
  "link.svg": "link",
  "scene.svg": "arrow",
  "media.svg": "play",
};

/** True when `icon` is a user-uploaded image (absolute path or URL). */
function isUploaded(icon: string): boolean {
  return icon.startsWith("/") || icon.includes("://");
}

/** Normalize a stored icon value to a glyph key (or `null` if it's an upload). */
export function glyphKey(icon: string): string | null {
  if (isUploaded(icon)) return null;
  const key = LEGACY_MAP[icon] ?? icon;
  return PIN_GLYPHS[key] ? key : null;
}

/** True for a built-in (recolorable) glyph pin, vs. a user-uploaded image. */
export function isBuiltinIcon(icon: string): boolean {
  return glyphKey(icon) !== null;
}

/** Build an icon-only (no teardrop) SVG string for a glyph key + color. */
export function pinSvgString(key: string, color = DEFAULT_PIN_COLOR): string {
  const glyph = (PIN_GLYPHS[key]?.svg ?? PIN_GLYPHS.dot.svg).replace(
    /@c/g,
    color
  );
  // A soft dark outline keeps the icon legible over any panorama.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">` +
    `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
    `paint-order="stroke" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))">${glyph}</g>` +
    `</svg>`;
}

/** A data-URI for a glyph pin, usable as an <img> src or PSV marker image. */
export function pinDataUri(key: string, color = DEFAULT_PIN_COLOR): string {
  return `data:image/svg+xml,${encodeURIComponent(pinSvgString(key, color))}`;
}

/**
 * Resolve a hotspot `icon` to an image src. Uploaded icons are returned as-is;
 * built-in glyphs render a recolored teardrop data-URI.
 */
export function iconSrc(icon: string, color = DEFAULT_PIN_COLOR): string {
  const key = glyphKey(icon);
  return key ? pinDataUri(key, color) : icon;
}

/** Default rendered size (px) for a built-in glyph icon. */
const GLYPH_SIZE = 34;

/** Inline HTML pin for the default (no explicit icon) marker. */
function pinHtml(h: Hotspot): string {
  return `<img src="${pinDataUri("dot", h.iconColor || DEFAULT_PIN_COLOR)}"
    width="${GLYPH_SIZE}" height="${GLYPH_SIZE}" style="display:block;cursor:pointer" alt="" />`;
}

/** A Photo Sphere Viewer markers-plugin config for one hotspot. */
export function markerForHotspot(h: Hotspot) {
  const base = {
    id: h.id,
    position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
    tooltip: h.label || undefined,
    data: h,
    anchor: "center center",
  };
  if (h.icon) {
    const key = glyphKey(h.icon);
    const s = h.iconSize ?? 40;
    return {
      ...base,
      image: iconSrc(h.icon, h.iconColor),
      size: key ? { width: GLYPH_SIZE, height: GLYPH_SIZE } : { width: s, height: s },
    };
  }
  return { ...base, html: pinHtml(h) };
}

export type MarkerAction =
  | { kind: "panel"; hotspot: Hotspot }
  | { kind: "link"; url: string }
  | { kind: "scene"; targetSceneId: string }
  | { kind: "none" };

/** Decide what selecting a hotspot should do, based on its type. */
export function actionForHotspot(h: Hotspot): MarkerAction {
  switch (h.type) {
    case "link":
      return h.url ? { kind: "link", url: h.url } : { kind: "none" };
    case "scene":
      return h.targetSceneId
        ? { kind: "scene", targetSceneId: h.targetSceneId }
        : { kind: "none" };
    case "info":
    case "media":
    default:
      return { kind: "panel", hotspot: h };
  }
}

/** True when a URL looks like a directly-embeddable image. */
export function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}
