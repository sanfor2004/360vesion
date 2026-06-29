/**
 * The 360° tour data model — the single source of truth shared by the studio
 * (authoring) and the viewer (runtime). Hotspots are stored by ANGLE
 * (yaw/pitch in degrees), never pixels, so they survive image re-encoding and
 * resolution changes.
 */

/** Equirectangular is the only projection we author today; cubemap is reserved. */
export type Projection = "equirectangular" | "cubemap";

/** Who can see a tour. `draft` = owner only; `unlisted` = anyone with the link. */
export type Visibility = "draft" | "public" | "unlisted";

/** What happens when a viewer selects a hotspot. */
export type HotspotType = "info" | "link" | "scene" | "media";

/** A stored panorama image and its variants. */
export interface ImageAsset {
  /** CDN/served URL of the full-resolution equirectangular image. */
  url: string;
  /** Pixel dimensions of `url`; should be exactly 2:1 (width = 2 × height). */
  width: number;
  height: number;
  /** Defaults to "equirectangular". */
  projection: Projection;
  /** Optional downscaled variant for mobile/fast load. */
  mobileUrl?: string;
  /** Optional small image for scene galleries. */
  thumbnailUrl?: string;
}

/** A point of interest on a panorama. */
export interface Hotspot {
  id: string;
  type: HotspotType;
  /** Short text shown as the marker tooltip. */
  label: string;
  /** Description / HTML / caption shown in a panel (info & media). */
  content: string;
  /** Horizontal angle in degrees. */
  yaw: number;
  /** Vertical angle in degrees; clamp to ±89 to avoid the poles. */
  pitch: number;
  /** Target scene to navigate to — only when `type === "scene"`. */
  targetSceneId?: string;
  /** External URL to open — only when `type === "link"` or `"media"`. */
  url?: string;
  /**
   * Which pin to render. A built-in glyph key (e.g. "door", "window") draws a
   * recolorable teardrop; an absolute path/URL is a user-uploaded image.
   */
  icon?: string;
  /** Pin color for built-in glyph pins (hex). Defaults to the teal brand color. */
  iconColor?: string;
  /** Rendered size in px for a custom uploaded icon (default 40). */
  iconSize?: number;
}

/** One panorama and its hotspots. */
export interface Scene {
  id: string;
  /** Human-friendly name, e.g. "Living Room". */
  name: string;
  image: ImageAsset;
  /** Where the camera faces on entry (degrees). */
  initialYaw: number;
  initialPitch: number;
  /** Initial field of view in degrees; ~75 is a sensible default. */
  initialFov: number;
  hotspots: Hotspot[];
}

/** The whole experience — one property, one showroom, one space. */
export interface Tour {
  id: string;
  title: string;
  /** Longer description shown on the tour/profile pages. */
  description: string;
  /** Publish state — controls who can view it. */
  visibility: Visibility;
  /** Which scene loads first. */
  startSceneId: string;
  scenes: Scene[];
  /** ISO date strings. */
  createdAt: string;
  updatedAt: string;

  // ---- community metadata (set/owned by the backend) ----
  /** Owner's user id. */
  ownerId?: string;
  /** Owner's public @handle, denormalized for display. */
  ownerUsername?: string | null;
  /** Owner's display name, denormalized for display. */
  ownerName?: string | null;
  /** Per-owner pretty slug. */
  slug?: string;
  /** Cover image URL for cards/feeds (defaults to the start scene thumbnail). */
  coverUrl?: string | null;
  /** Public view counter. */
  viewCount?: number;
}

/** Response shape from POST /api/upload. */
export interface UploadResult {
  url: string;
  width: number;
  height: number;
  mobileUrl?: string;
  thumbnailUrl?: string;
}

/** Sensible defaults used across studio + viewer. */
export const DEFAULT_FOV = 75;
export const DEFAULT_YAW = 0;
export const DEFAULT_PITCH = 0;
/** GPU texture cap — reject panoramas wider than this. */
export const MAX_IMAGE_WIDTH = 8192;
