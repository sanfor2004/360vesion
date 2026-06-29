/**
 * POST /api/upload  (auth-gated)
 *
 * Accepts an equirectangular image (multipart form field "file"), validates it,
 * generates a mobile variant + thumbnail, stores all three via the storage seam,
 * and returns an UploadResult. Re-encoding to JPEG also strips GPano/EXIF.
 *
 * Validation: exactly 2:1 (small tolerance) and width <= MAX_IMAGE_WIDTH.
 */
import sharp from "sharp";
import { v4 as uuid } from "uuid";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { putObject } from "@/lib/storage";
import { MAX_IMAGE_WIDTH, type UploadResult } from "@/lib/types";

export const runtime = "nodejs";

const MOBILE_WIDTH = 2048;
const THUMB_WIDTH = 400;
const RATIO_TOLERANCE = 0.01; // |w/h - 2| must be within this

export async function POST(req: Request) {
  if (!(await getCurrentUser())) return unauthorized();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "missing file field" }, { status: 400 });
  }

  const input = Buffer.from(await file.arrayBuffer());

  let meta;
  try {
    meta = await sharp(input).metadata();
  } catch {
    return Response.json({ error: "unreadable image" }, { status: 422 });
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    return Response.json({ error: "image has no dimensions" }, { status: 422 });
  }
  if (Math.abs(width / height - 2) > RATIO_TOLERANCE) {
    return Response.json(
      {
        error: `image must be 2:1 equirectangular (got ${width}×${height})`,
      },
      { status: 422 }
    );
  }
  if (width > MAX_IMAGE_WIDTH) {
    return Response.json(
      { error: `image too wide (${width}px); max ${MAX_IMAGE_WIDTH}px` },
      { status: 422 }
    );
  }

  const base = uuid();
  // Full: normalize to JPEG (strips metadata). Variants: downscaled.
  const full = await sharp(input).jpeg({ quality: 85 }).toBuffer();
  const mobile = await sharp(input)
    .resize({ width: MOBILE_WIDTH })
    .jpeg({ quality: 80 })
    .toBuffer();
  const thumb = await sharp(input)
    .resize({ width: THUMB_WIDTH })
    .jpeg({ quality: 72 })
    .toBuffer();

  const [url, mobileUrl, thumbnailUrl] = await Promise.all([
    putObject(`${base}.jpg`, full),
    putObject(`${base}-${MOBILE_WIDTH}.jpg`, mobile),
    putObject(`${base}-thumb.jpg`, thumb),
  ]);

  const result: UploadResult = { url, width, height, mobileUrl, thumbnailUrl };
  return Response.json(result, { status: 201 });
}
