/** Shared runtime model for local Studio authoring and Viewer playback. */
export type Projection = "equirectangular" | "cubemap";
export type HotspotType = "info" | "link" | "scene" | "media" | "text";

export interface ImageAsset {
  url: string;
  width: number;
  height: number;
  projection: Projection;
  mobileUrl?: string;
  thumbnailUrl?: string;
}

/** Panorama positions are angular degrees, never screen pixels. */
export interface Hotspot {
  id: string;
  type: HotspotType;
  label: string;
  content: string;
  yaw: number;
  pitch: number;
  targetSceneId?: string;
  url?: string;
  icon?: string;
  iconColor?: string;
  iconSize?: number;
  fontSize?: number;
}

export interface Scene {
  id: string;
  name: string;
  image: ImageAsset;
  initialYaw: number;
  initialPitch: number;
  initialFov: number;
  hotspots: Hotspot[];
  floorId?: string;
}

/** Floor-plan positions are percentages so plans stay responsive. */
export interface FloorPlanPoint {
  id: string;
  sceneId: string;
  label: string;
  x: number;
  y: number;
}

export interface FloorPlanFloor {
  id: string;
  name: string;
  imageUrl?: string;
  points: FloorPlanPoint[];
}

export interface FloorPlan {
  enabled: boolean;
  floors: FloorPlanFloor[];
}

/** One complete, portable local project. */
export interface Tour {
  id: string;
  title: string;
  description: string;
  startSceneId: string;
  scenes: Scene[];
  floorPlan?: FloorPlan;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResult {
  url: string;
  width: number;
  height: number;
  mobileUrl?: string;
  thumbnailUrl?: string;
}

export const DEFAULT_FOV = 75;
export const MAX_IMAGE_WIDTH = 8192;
