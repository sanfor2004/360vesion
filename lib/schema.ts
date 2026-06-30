/**
 * Zod schemas mirroring the interfaces in `types.ts`. Used to validate tour
 * JSON arriving at POST/PUT so the (semi-public) CRUD endpoints can't be fed
 * malformed data. Keep these in step with types.ts.
 */
import { z } from "zod";
import { MAX_IMAGE_WIDTH } from "./types";

export const projectionSchema = z.enum(["equirectangular", "cubemap"]);
export const hotspotTypeSchema = z.enum([
  "info",
  "link",
  "scene",
  "media",
  "text",
]);
export const visibilitySchema = z.enum(["draft", "public", "unlisted"]);

export const imageAssetSchema = z.object({
  url: z.string().min(1),
  width: z.number().int().positive().max(MAX_IMAGE_WIDTH),
  height: z.number().int().positive(),
  projection: projectionSchema.default("equirectangular"),
  mobileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export const hotspotSchema = z.object({
  id: z.string().min(1),
  type: hotspotTypeSchema,
  label: z.string(),
  content: z.string(),
  yaw: z.number(),
  pitch: z.number().min(-89).max(89),
  targetSceneId: z.string().optional(),
  url: z.string().optional(),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  iconSize: z.number().min(12).max(160).optional(),
  fontSize: z.number().min(8).max(200).optional(),
});

export const sceneSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  image: imageAssetSchema,
  initialYaw: z.number(),
  initialPitch: z.number(),
  initialFov: z.number(),
  hotspots: z.array(hotspotSchema),
});

export const tourSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().default(""),
  visibility: visibilitySchema.default("draft"),
  startSceneId: z.string(),
  scenes: z.array(sceneSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Body accepted by PUT /api/tours/:id and POST /api/tours. Timestamps and
 * community metadata (id/owner/slug/cover) are assigned by the server and ignored
 * if sent by the client.
 */
export const tourInputSchema = tourSchema
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    id: z.string().min(1).optional(),
    description: z.string().optional(),
    visibility: visibilitySchema.optional(),
    // Optional so a fresh tour can be created from just a title; the store fills
    // sensible defaults (empty scene list, first scene as start).
    startSceneId: z.string().optional(),
    scenes: z.array(sceneSchema).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  });

export type TourInput = z.infer<typeof tourInputSchema>;
